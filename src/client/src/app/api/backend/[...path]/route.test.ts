// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { MAX_FORWARDED_BODY_BYTES } from "@/libs/backend-path";
import { DELETE, GET, PATCH, POST } from "./route";

const ctx = (...path: string[]) => ({ params: Promise.resolve({ path }) });

function request(url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
  return new NextRequest(`http://localhost:3000/api/backend/${url}`, {
    method: init.method ?? "GET",
    headers: new Headers(init.headers),
    body: init.body,
  });
}

const sentAuthorization = (fetchMock: ReturnType<typeof vi.fn>) =>
  (fetchMock.mock.calls[0]![1].headers as Headers).get("authorization");

describe("/api/backend forwarder (plan 005 step 7, approved Q1)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv("BACKEND_API_URL", "http://backend:8080/api/v1/");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_DEV_BACKEND_TOKEN", "");
    vi.stubEnv("DEV_BACKEND_TOKEN", "dev-token");
    fetchMock = vi.fn().mockImplementation(async () =>
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ETag: '"2"', "X-Secret": "no" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    warn.mockRestore();
  });

  it("passes the user's bearer on unchanged and never swaps in the dev token", async () => {
    vi.stubEnv("ALLOW_DEV_BACKEND_TOKEN", "true");
    await GET(request("hub/services", { headers: { Authorization: "Bearer user-token" } }), ctx("hub", "services"));
    expect(sentAuthorization(fetchMock)).toBe("Bearer user-token");
    expect(warn).not.toHaveBeenCalled();
  });

  it("forwards without a token by default and lets the backend answer 401", async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"success":false}', { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="api"' } }));
    const res = await GET(request("hub/services"), ctx("hub", "services"));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(sentAuthorization(fetchMock)).toBeNull();
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toBe('Bearer realm="api"');
    expect(warn).not.toHaveBeenCalled();
  });

  it("uses DEV_BACKEND_TOKEN only with the opt-in, outside production, without Authorization, and warns each time", async () => {
    vi.stubEnv("ALLOW_DEV_BACKEND_TOKEN", "true");
    await GET(request("hub/services"), ctx("hub", "services"));
    await GET(request("admin/services"), ctx("admin", "services"));
    expect(fetchMock.mock.calls.map(([, init]) => (init.headers as Headers).get("authorization"))).toEqual([
      "Bearer dev-token",
      "Bearer dev-token",
    ]);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[0]![0])).toContain("DEV_BACKEND_TOKEN used for GET /hub/services");
  });

  it.each([
    ["the opt-in is not exactly true", { ALLOW_DEV_BACKEND_TOKEN: "1" }],
    ["NODE_ENV is production", { ALLOW_DEV_BACKEND_TOKEN: "true", NODE_ENV: "production" }],
    ["no dev token is set", { ALLOW_DEV_BACKEND_TOKEN: "true", DEV_BACKEND_TOKEN: " " }],
  ])("does not use the dev token when %s", async (_label, env) => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    await GET(request("hub/services"), ctx("hub", "services"));
    expect(sentAuthorization(fetchMock)).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it("never attaches the dev token to sign-in and session calls", async () => {
    vi.stubEnv("ALLOW_DEV_BACKEND_TOKEN", "true");
    await POST(
      request("auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"email":"a"}' }),
      ctx("auth", "login"),
    );
    expect(sentAuthorization(fetchMock)).toBeNull();
    expect(fetchMock.mock.calls[0]![0]).toBe("http://backend:8080/api/v1/auth/login");
  });

  it("forwards the query, and passes back status and ETag only", async () => {
    const res = await GET(
      request("admin/services?includeInactive=true", { headers: { Authorization: "Bearer u" } }),
      ctx("admin", "services"),
    );
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://backend:8080/api/v1/admin/services?includeInactive=true");
    expect(init.body).toBeUndefined();
    expect(res.status).toBe(200);
    expect(res.headers.get("etag")).toBe('"2"');
    expect(res.headers.get("x-secret")).toBeNull();
  });

  it("forwards the body, content type and If-Match on mutations", async () => {
    await PATCH(
      request("admin/services/3", {
        method: "PATCH",
        headers: { Authorization: "Bearer u", "Content-Type": "application/json; charset=utf-8", "If-Match": '"1"' },
        body: '{"name":"x"}',
      }),
      ctx("admin", "services", "3"),
    );
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe("PATCH");
    // Bytes, not text, and the whole Content-Type (plan 006 step 7: multipart needs its boundary).
    expect(new TextDecoder().decode(init.body as Uint8Array)).toBe('{"name":"x"}');
    expect((init.headers as Headers).get("content-type")).toBe("application/json; charset=utf-8");
    expect((init.headers as Headers).get("if-match")).toBe('"1"');
  });

  it("reaches the paths the client uses and refuses everything else", async () => {
    await DELETE(request("admin/users/1", { method: "DELETE" }), ctx("admin", "users", "1"));
    expect(fetchMock).toHaveBeenCalledOnce();

    const refused = await GET(request("ai/chat"), ctx("ai", "chat"));
    expect(refused.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("answers 502 when the backend cannot be reached", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    const res = await GET(request("hub/services"), ctx("hub", "services"));
    expect(res.status).toBe(502);
  });

  it("answers 500 when BACKEND_API_URL is missing", async () => {
    vi.stubEnv("BACKEND_API_URL", "");
    const res = await GET(request("hub/services"), ctx("hub", "services"));
    expect(res.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("/api/backend forwarder: profile, multipart and binary (plan 006 step 7)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("BACKEND_API_URL", "http://backend:8080/api/v1/");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_DEV_BACKEND_TOKEN", "");
    fetchMock = vi.fn().mockImplementation(async () => Response.json({ success: true, data: { avatarUrl: "/x" } }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  async function multipartRequest(bytes: Uint8Array) {
    const form = new FormData();
    form.append("avatar", new File([bytes as BlobPart], "me.png", { type: "image/png" }));
    // Let Request encode the multipart body, as a browser would, then forward it.
    const encoded = new Request("http://localhost:3000/api/backend/profile/avatar", { method: "POST", body: form });
    const contentType = encoded.headers.get("content-type")!;
    const raw = new Uint8Array(await encoded.arrayBuffer());
    return {
      contentType,
      raw,
      request: new NextRequest("http://localhost:3000/api/backend/profile/avatar", {
        method: "POST",
        headers: { Authorization: "Bearer u", "Content-Type": contentType, "Content-Length": String(raw.byteLength) },
        body: raw,
      }),
    };
  }

  it("forwards a multipart upload byte for byte, keeping the boundary", async () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 255, 128, 7]); // includes non-UTF-8 bytes
    const { contentType, raw, request: req } = await multipartRequest(png);
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);

    const res = await POST(req, ctx("profile", "avatar"));
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://backend:8080/api/v1/profile/avatar");
    expect((init.headers as Headers).get("content-type")).toBe(contentType);
    expect((init.headers as Headers).get("authorization")).toBe("Bearer u");
    expect(new Uint8Array(init.body as Uint8Array)).toEqual(raw);

    // The backend can parse what it receives.
    const parsed = await new Request("http://x", { method: "POST", headers: { "Content-Type": contentType }, body: init.body as BodyInit }).formData();
    const file = parsed.get("avatar") as File;
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(png);
  });

  it("rejects an upload body above 10 MiB + 64 KiB with 413 before calling the backend", async () => {
    const declared = new NextRequest("http://localhost:3000/api/backend/profile/avatar", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=x", "Content-Length": String(MAX_FORWARDED_BODY_BYTES + 1) },
      body: new Uint8Array(16),
    });
    const res = await POST(declared, ctx("profile", "avatar"));
    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({ success: false, statusCode: 413 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stops reading a body that is larger than its Content-Length claims", async () => {
    const big = new Uint8Array(MAX_FORWARDED_BODY_BYTES + 1024);
    const lying = new NextRequest("http://localhost:3000/api/backend/profile/avatar", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=x", "Content-Length": "10" },
      body: big,
    });
    const res = await POST(lying, ctx("profile", "avatar"));
    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a body exactly at the limit", async () => {
    const atLimit = new NextRequest("http://localhost:3000/api/backend/profile/avatar", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=x" },
      body: new Uint8Array(MAX_FORWARDED_BODY_BYTES),
    });
    expect((await POST(atLimit, ctx("profile", "avatar"))).status).toBe(200);
    expect((fetchMock.mock.calls[0]![1].body as Uint8Array).byteLength).toBe(MAX_FORWARDED_BODY_BYTES);
  });

  it("passes image bytes and their headers through unchanged", async () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 255, 254, 1]);
    fetchMock.mockResolvedValueOnce(
      new Response(png, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Length": String(png.byteLength),
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "Set-Cookie": "leak=1",
        },
      }),
    );
    const res = await GET(
      new NextRequest("http://localhost:3000/api/backend/profile/avatar/files/a.png", { headers: { Authorization: "Bearer u" } }),
      ctx("profile", "avatar", "files", "a.png"),
    );
    expect(res.status).toBe(200);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(png);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("refuses avatar file traversal and odd names", async () => {
    for (const segments of [["profile", "avatar", "files", ".."], ["profile", "avatar", "files", "a", "b.png"], ["profile", "avatar", "files", "../x"]]) {
      const res = await GET(new NextRequest(`http://localhost:3000/api/backend/${segments.join("/")}`), ctx(...segments));
      expect(res.status, segments.join("/")).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards GET /profile and DELETE /profile/avatar without a body", async () => {
    await GET(new NextRequest("http://localhost:3000/api/backend/profile", { headers: { Authorization: "Bearer u" } }), ctx("profile"));
    await DELETE(
      new NextRequest("http://localhost:3000/api/backend/profile/avatar", { method: "DELETE", headers: { Authorization: "Bearer u" } }),
      ctx("profile", "avatar"),
    );
    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body])).toEqual([
      ["http://backend:8080/api/v1/profile", "GET", undefined],
      ["http://backend:8080/api/v1/profile/avatar", "DELETE", undefined],
    ]);
  });
});
