import { describe, expect, it } from "vitest";
import { ApiError, type ApiErrorCode } from "@/libs/api-client";
import { toUserMessage } from "@/libs/error-messages";

const err = (code: ApiErrorCode, status = 400, extra: Partial<ApiError> = {}) =>
  new ApiError({ status, code, ...extra });

describe("toUserMessage", () => {
  it("uses the same text for unknown email and wrong password", () => {
    expect(toUserMessage(err("INVALID_CREDENTIALS", 401), "login")).toBe(
      "Email or password is incorrect.",
    );
  });

  it("maps every sign-in failure to non-technical copy", () => {
    expect(toUserMessage(err("ACCOUNT_DISABLED", 403), "login")).toBe(
      "This account is disabled. Contact the administrator.",
    );
    expect(toUserMessage(err("ROLE_MISSING", 403), "login")).toBe(
      "This account cannot be signed in. Contact the administrator.",
    );
    expect(toUserMessage(err("NETWORK_ERROR", 0), "login")).toBe(
      "The service is unavailable. Please try again.",
    );
    expect(toUserMessage(err("SERVICE_UNAVAILABLE", 503), "login")).toBe(
      "The service is unavailable. Please try again.",
    );
  });

  it("includes the retry time for a locked account", () => {
    const message = toUserMessage(
      new ApiError({ status: 423, code: "ACCOUNT_LOCKED", retryAfterSeconds: 600 }),
      "login",
    );
    expect(message).toMatch(/^Too many failed attempts\. Try again after \d{2}:\d{2}\.$/);
  });

  it("explains the one-role rule for a rejected role on account creation", () => {
    const error = new ApiError({
      status: 400,
      code: "VALIDATION_FAILED",
      fieldErrors: { role: "Must be one value" },
    });
    expect(toUserMessage(error, "createAccount")).toContain("exactly one role");
  });

  it("never leaks status numbers or server text", () => {
    const codes: ApiErrorCode[] = ["UNKNOWN", "FORBIDDEN", "DUPLICATE_VALUE", "CURRENT_PASSWORD_INCORRECT"];
    for (const code of codes) {
      const text = toUserMessage(new ApiError({ status: 500, code, message: "stack trace at x.ts:1" }), "load");
      expect(text).not.toMatch(/\d{3}|stack|x\.ts/);
    }
    expect(toUserMessage(new Error("raw"), "load")).toBe("The service is unavailable. Please try again.");
  });
  it("service-link administration copy (manageServiceLink)", () => {
    const e = (status: number, code: ApiErrorCode) => new ApiError({ status, code });
    expect(toUserMessage(e(409, "DUPLICATE_VALUE"), "manageServiceLink")).toBe("A service with this name already exists.");
    expect(toUserMessage(e(412, "PRECONDITION_FAILED"), "manageServiceLink")).toBe(
      "This link was changed by someone else. Reload to see the latest version, then try again.",
    );
    expect(toUserMessage(e(404, "NOT_FOUND"), "manageServiceLink")).toBe("This link no longer exists. Reload to see the current list.");
    expect(toUserMessage(e(400, "VALIDATION_FAILED"), "manageServiceLink")).toBe("Some fields need your attention.");
    expect(toUserMessage(e(503, "SERVICE_UNAVAILABLE"), "hub")).toBe("The service is unavailable. Please try again.");
    expect(toUserMessage(e(403, "FORBIDDEN"), "hub")).toBe("You don't have permission to do this.");
  });
});
