import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  api,
  setAccountDisabledHandler,
  setPasswordChangeRequiredHandler,
  setTokenProvider,
  setUnauthorizedHandler,
  unwrap,
} from "./api-client";

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setTokenProvider(null);
    setUnauthorizedHandler(null);
    setAccountDisabledHandler(null);
    setPasswordChangeRequiredHandler(null);
  });

  it("forwards an abort signal to fetch and returns parsed JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ data: { ok: true } }));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    const result = await api.get<{ data: { ok: boolean } }>("/activities/landing", {
      signal: controller.signal,
    });

    expect(result).toEqual({ data: { ok: true } });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/activities/landing",
      expect.objectContaining({ signal: controller.signal, method: "GET" }),
    );
  });

  it("attaches the bearer token only to the API base URL", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => json({ data: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    setTokenProvider(() => "tok");

    await api.get("/auth/me");
    await api.get("https://other.example/x");

    const first = fetchMock.mock.calls[0][1].headers as Headers;
    const second = fetchMock.mock.calls[1][1].headers as Headers;
    expect(first.get("Authorization")).toBe("Bearer tok");
    expect(second.get("Authorization")).toBeNull();
  });

  it("normalizes ErrorResponse into ApiError with field errors and Retry-After", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json(
          {
            success: false,
            code: "ACCOUNT_LOCKED",
            message: "Locked",
            errors: [{ field: "email", message: "bad" }],
          },
          423,
          { "Retry-After": "120" },
        ),
      ),
    );

    const error = await api.post("/auth/login", {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 423,
      code: "ACCOUNT_LOCKED",
      retryAfterSeconds: 120,
      fieldErrors: { email: "bad" },
    });
  });

  it("maps non-JSON server errors to UNKNOWN without leaking the raw text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("server exploded", { status: 500 })));

    const error = (await api.get("/x").catch((e: unknown) => e)) as ApiError;
    expect(error.code).toBe("UNKNOWN");
    expect(error.message).not.toContain("exploded");
  });

  it("maps a failed fetch to NETWORK_ERROR", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(api.get("/x")).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 });
  });

  it("calls the session handlers for 401, ACCOUNT_DISABLED and PASSWORD_CHANGE_REQUIRED", async () => {
    const onUnauthorized = vi.fn();
    const onDisabled = vi.fn();
    const onMustChange = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    setAccountDisabledHandler(onDisabled);
    setPasswordChangeRequiredHandler(onMustChange);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ success: false, code: "UNAUTHENTICATED", message: "x" }, 401))
      .mockResolvedValueOnce(json({ success: false, code: "ACCOUNT_DISABLED", message: "x" }, 403))
      .mockResolvedValueOnce(json({ success: false, code: "PASSWORD_CHANGE_REQUIRED", message: "x" }, 403))
      .mockResolvedValueOnce(json({ success: false, code: "INVALID_CREDENTIALS", message: "x" }, 401));
    vi.stubGlobal("fetch", fetchMock);

    await api.get("/a").catch(() => undefined);
    await api.get("/b").catch(() => undefined);
    await api.get("/c").catch(() => undefined);
    await api.post("/auth/login", {}, { skipSessionHandlers: true }).catch(() => undefined);

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(onDisabled).toHaveBeenCalledTimes(1);
    expect(onMustChange).toHaveBeenCalledTimes(1);
  });

  it("unwraps the contract envelope", () => {
    expect(unwrap({ data: 5 })).toBe(5);
    expect(() => unwrap({})).toThrow(ApiError);
  });
});
