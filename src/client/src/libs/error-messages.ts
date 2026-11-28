import { isApiError, type ApiErrorCode } from "@/libs/api-client";

/** The ONLY place where error codes become user-facing copy (spec FR-011). */
export type ErrorContext =
  | "login"
  | "logout"
  | "changePassword"
  | "createAccount"
  | "load"
  /** University Services Hub reads (UC-07). */
  | "hub"
  /** Service-link administration (BR-ADM-01): 409 / 412 / 404 copy. */
  | "manageServiceLink";

const UNAVAILABLE = "The service is unavailable. Please try again.";

/** Service-link administration copy (spec 004 US3 #4, #5). */
const SERVICE_LINK_MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  DUPLICATE_VALUE: "A service with this name already exists.",
  PRECONDITION_FAILED: "This link was changed by someone else. Reload to see the latest version, then try again.",
  NOT_FOUND: "This link no longer exists. Reload to see the current list.",
};

function formatRetryTime(retryAfterSeconds: number | undefined): string | null {
  if (retryAfterSeconds === undefined || !Number.isFinite(retryAfterSeconds)) {
    return null;
  }
  const at = new Date(Date.now() + retryAfterSeconds * 1000);
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(at);
}

const MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  INVALID_CREDENTIALS: "Email or password is incorrect.",
  ACCOUNT_DISABLED: "This account is disabled. Contact the administrator.",
  ROLE_MISSING: "This account cannot be signed in. Contact the administrator.",
  UNAUTHENTICATED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You don't have permission to do this.",
  NOT_FOUND: "The requested item could not be found.",
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect.",
  DUPLICATE_VALUE: "This value is already in use.",
  ROLE_POLICY_VIOLATION:
    "This role assignment is not allowed. Student number and faculty can only be set for student accounts.",
  PASSWORD_CHANGE_REQUIRED: "Set a new password before continuing.",
  PRECONDITION_FAILED: "This item was changed by someone else. Reload and review it again.",
  NETWORK_ERROR: UNAVAILABLE,
  SERVICE_UNAVAILABLE: UNAVAILABLE,
  UNKNOWN: UNAVAILABLE,
};

export function toUserMessage(error: unknown, context: ErrorContext): string {
  if (!isApiError(error)) {
    return UNAVAILABLE;
  }

  if (error.code === "ACCOUNT_LOCKED") {
    const time = formatRetryTime(error.retryAfterSeconds);
    return time
      ? `Too many failed attempts. Try again after ${time}.`
      : "Too many failed attempts. Try again later.";
  }

  if (error.code === "VALIDATION_FAILED") {
    if (context === "createAccount" && "role" in error.fieldErrors) {
      return "Each account has exactly one role. Use separate accounts for different roles.";
    }
    return "Some fields need your attention.";
  }

  if (context === "manageServiceLink" && SERVICE_LINK_MESSAGES[error.code]) {
    return SERVICE_LINK_MESSAGES[error.code]!;
  }

  if (error.code === "UNAUTHENTICATED" && context === "logout") {
    return "You have been signed out.";
  }

  if (error.status >= 500) {
    return UNAVAILABLE;
  }

  return MESSAGES[error.code] ?? UNAVAILABLE;
}
