// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH } from "./route";

const ctx = (...path: string[]) => ({ params: Promise.resolve({ path }) });

function request(url: string, init: { method?: string; cookie?: string; headers?: Record<string, string>; body?: string } = {}) {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set("cookie", init.cookie);
  return new NextRequest(`http://localhost:3000/api/backend/${url}`, { method: init.method ?? "GET", headers, body: init.body });
}

describe("/api/backend forwarder", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("BACKEND_API_URL", "http://backend:8080/api/v1/");
    vi.stubEnv("DEV_BACKEND_TOKEN", "abc");
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ETag: '"2"', "X-Secret": "no" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("answers 401 without calling the backend when there is no backend token", async () => {
    vi.stubEnv("DEV_BACKEND_TOKEN", "");
    const res = await GET(request("hub/services"), ctx("hub", "services"));
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards with the Bearer token and query, and passes back status and ETag only", async () => {
    const res = await GET(request("admin/services?includeInactive=true", {}), ctx("admin", "services"));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://backend:8080/api/v1/admin/services?includeInactive=true");
    expect((init.headers as Headers).get("authorization")).toBe("Bearer abc");
    expect(init.body).toBeUndefined();
    expect(res.status).toBe(200);
    expect(res.headers.get("etag")).toBe('"2"');
    expect(res.headers.get("x-secret")).toBeNull();
  });

  it("forwards the body, content type and If-Match on mutations", async () => {
    await PATCH(
      request("admin/services/3", { method: "PATCH", headers: { "Content-Type": "application/json; charset=utf-8", "If-Match": '"1"' }, body: '{"name":"x"}' }),
      ctx("admin", "services", "3"),
    );
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe('{"name":"x"}');
    expect((init.headers as Headers).get("content-type")).toBe("application/json");
    expect((init.headers as Headers).get("if-match")).toBe('"1"');
  });

  it("refuses paths outside the hub", async () => {
    const res = await DELETE(request("admin/users/1", { method: "DELETE" }), ctx("admin", "users", "1"));
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 502 when the backend cannot be reached", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    const res = await GET(request("hub/services", {}), ctx("hub", "services"));
    expect(res.status).toBe(502);
  });
});
