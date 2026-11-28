import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  api,
  setAccountDisabledHandler,
  setPasswordChangeRequiredHandler,
  setTokenProvider,
  setUnauthorizedHandler,
  unwrap,
  unwrapServiceResponse,
  versionFromEtag,
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
  describe("hub ServiceResponse envelope (DOC-16)", () => {
    function hubError(status: number, message: string, details?: unknown[]) {
      return json(
        { success: false, statusCode: status, payload: { message, ...(details ? { data: { details } } : {}) } },
        status,
      );
    }

    it("reads field errors and per-field codes from payload.data.details", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          hubError(400, "Validation failed (BAD_REQUEST)", [
            { field: "url", code: "INVALID_URL", message: "Use a full http:// or https:// address" },
            { field: "name", code: "REQUIRED", message: "Name is required" },
          ]),
        ),
      );

      const error = (await api.post("/admin/services", {}).catch((e: unknown) => e)) as ApiError;
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        status: 400,
        code: "VALIDATION_FAILED",
        message: "Validation failed (BAD_REQUEST)",
        fieldErrors: { url: "Use a full http:// or https:// address", name: "Name is required" },
      });
      expect(error.details).toEqual([
        { field: "url", code: "INVALID_URL", message: "Use a full http:// or https:// address" },
        { field: "name", code: "REQUIRED", message: "Name is required" },
      ]);
    });

    it("takes a known code from details (409 DUPLICATE_VALUE)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          hubError(409, "Conflict (CONFLICT)", [
            { field: "name", code: "DUPLICATE_VALUE", message: "A service with this name already exists" },
          ]),
        ),
      );
      await expect(api.post("/admin/services", {})).rejects.toMatchObject({
        status: 409,
        code: "DUPLICATE_VALUE",
        fieldErrors: { name: "A service with this name already exists" },
      });
    });

    it.each([
      [401, "UNAUTHENTICATED"],
      [403, "FORBIDDEN"],
      [404, "NOT_FOUND"],
      [412, "PRECONDITION_FAILED"],
      [503, "SERVICE_UNAVAILABLE"],
      [502, "UNKNOWN"],
    ] as const)("maps a hub %i without details to %s", async (status, code) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(hubError(status, "x")));
      await expect(api.get("/hub/services")).rejects.toMatchObject({ status, code, fieldErrors: {} });
    });

    it("unwraps payload.data and rejects a missing one", () => {
      expect(unwrapServiceResponse({ success: true, statusCode: 200, payload: { message: "OK", data: [1] } })).toEqual([1]);
      expect(() => unwrapServiceResponse({ success: true, statusCode: 200, payload: { message: "OK" } })).toThrow(ApiError);
      expect(() => unwrapServiceResponse(undefined)).toThrow(ApiError);
    });

    it("reads the version from an ETag", () => {
      expect(versionFromEtag(new Headers({ ETag: '"3"' }))).toBe(3);
      expect(versionFromEtag(new Headers({ ETag: 'W/"12"' }))).toBe(12);
      expect(versionFromEtag(new Headers({ ETag: "abc" }))).toBeNull();
      expect(versionFromEtag(new Headers())).toBeNull();
    });

    it("returns the ETag header from api.request", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          json({ success: true, statusCode: 200, payload: { message: "OK", data: { id: "1" } } }, 200, { ETag: '"2"' }),
        ),
      );
      const res = await api.request<{ payload: { data: { id: string } } }>("/admin/services/1", "PATCH", {
        body: { name: "x" },
        headers: { "If-Match": '"1"' },
      });
      expect(versionFromEtag(res.headers)).toBe(2);
      const init = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![1] as RequestInit;
      expect(init.method).toBe("PATCH");
      expect(new Headers(init.headers).get("If-Match")).toBe('"1"');
    });
  });
});
