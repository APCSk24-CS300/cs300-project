// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
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
    expect(init.body).toBe('{"name":"x"}');
    expect((init.headers as Headers).get("content-type")).toBe("application/json");
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
