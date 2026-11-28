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
        message: "Validation failed", // the " (BAD_REQUEST)" suffix is stripped (step 006-2)
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
  it("attaches the bearer to a same-origin relative base URL (real mode via /api/backend)", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "/api/backend/");
    const fetchMock = vi.fn().mockImplementation(async () => json({ success: true, statusCode: 200, payload: { message: "OK", data: [] } }));
    vi.stubGlobal("fetch", fetchMock);
    setTokenProvider(() => "user-token");
    await api.get("/hub/services");
    await api.get("https://other.example/x");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/backend/hub/services");
    expect(new Headers((init as RequestInit).headers).get("Authorization")).toBe("Bearer user-token");
    expect(new Headers((fetchMock.mock.calls[1]![1] as RequestInit).headers).get("Authorization")).toBeNull();
    vi.unstubAllEnvs();
  });
  describe("profile responses (plan 006 step 2, DOC-20)", () => {
    function serviceError(status: number, message: string, details?: unknown) {
      return json({ success: false, statusCode: status, payload: { message, ...(details !== undefined ? { data: { details } } : {}) } }, status);
    }

    it("maps an object-shaped details { field } to that field, using payload.message without the status suffix", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          serviceError(400, "Enter a 10-digit number starting with 0 or +84 followed by 9 digits (BAD_REQUEST)", { field: "phoneNumber" }),
        ),
      );
      const error = (await api.patch("/profile", { phoneNumber: "1" }).catch((e: unknown) => e)) as ApiError;
      expect(error).toMatchObject({
        status: 400,
        code: "VALIDATION_FAILED",
        message: "Enter a 10-digit number starting with 0 or +84 followed by 9 digits",
        fieldErrors: { phoneNumber: "Enter a 10-digit number starting with 0 or +84 followed by 9 digits" },
      });
      expect(error.details).toEqual([{ field: "phoneNumber", message: "Enter a 10-digit number starting with 0 or +84 followed by 9 digits" }]);
    });

    it("maps a 409 duplicate phone to DUPLICATE_VALUE on the field", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(serviceError(409, "Phone number is already in use (CONFLICT)", { field: "phoneNumber" })));
      await expect(api.patch("/profile", { phoneNumber: "0901234567" })).rejects.toMatchObject({
        code: "DUPLICATE_VALUE",
        fieldErrors: { phoneNumber: "Phone number is already in use" },
      });
    });

    it("ignores details objects without a field (e.g. { fields: [...] })", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(serviceError(400, "Only phoneNumber may be updated (BAD_REQUEST)", { fields: ["fullName"] })));
      await expect(api.patch("/profile", { fullName: "x" })).rejects.toMatchObject({
        code: "VALIDATION_FAILED",
        message: "Only phoneNumber may be updated",
        fieldErrors: {},
      });
    });

    it("keeps CURRENT_PASSWORD_INCORRECT and knows INTERNAL_ERROR (contract envelope)", async () => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValueOnce(
            json({ success: false, code: "CURRENT_PASSWORD_INCORRECT", message: "Current password is incorrect", errors: [{ field: "currentPassword", code: "INCORRECT", message: "Current password is incorrect" }] }, 400),
          )
          .mockResolvedValueOnce(json({ success: false, code: "INTERNAL_ERROR", message: "Password could not be changed. Please try again." }, 500)),
      );
      await expect(api.patch("/profile/password", {})).rejects.toMatchObject({
        status: 400,
        code: "CURRENT_PASSWORD_INCORRECT",
        fieldErrors: { currentPassword: "Current password is incorrect" },
      });
      await expect(api.patch("/profile/password", {})).rejects.toMatchObject({ status: 500, code: "INTERNAL_ERROR" });
    });

    it("api.blob reads a binary body with the bearer, and parses a JSON error as usual", async () => {
      const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(png, { status: 200, headers: { "Content-Type": "image/png" } }))
        .mockResolvedValueOnce(json({ success: false, message: "Picture not found" }, 404));
      vi.stubGlobal("fetch", fetchMock);
      setTokenProvider(() => "user-token");

      const blob = await api.blob("/profile/avatar/files/a.png");
      expect(blob.type).toBe("image/png");
      expect(blob.size).toBe(png.byteLength); // bytes are not re-read: jsdom and Node Blobs are different realms
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://localhost:8080/api/v1/profile/avatar/files/a.png");
      expect((init as RequestInit).method).toBe("GET");
      expect(new Headers((init as RequestInit).headers).get("Authorization")).toBe("Bearer user-token");

      await expect(api.blob("/profile/avatar/files/b.png")).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
    });

    it("sends FormData unchanged so the browser sets the multipart boundary", async () => {
      const fetchMock = vi.fn().mockImplementation(async () => json({ success: true, data: { avatarUrl: "/x" } }));
      vi.stubGlobal("fetch", fetchMock);
      const form = new FormData();
      form.append("avatar", new Blob([new Uint8Array([1])], { type: "image/png" }), "a.png");
      await api.post("/profile/avatar", form);
      const init = fetchMock.mock.calls[0]![1] as RequestInit;
      expect(init.body).toBe(form);
      expect(new Headers(init.headers).get("Content-Type")).toBeNull();
    });
  });
});
