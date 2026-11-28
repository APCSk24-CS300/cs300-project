/**
 * The single HTTP transport of the client (constitution C-III).
 * Owns: base URL, bearer header, JSON serialization, error normalization into `ApiError`,
 * and the session callbacks (401 / ACCOUNT_DISABLED / PASSWORD_CHANGE_REQUIRED).
 */

const DEFAULT_BASE_URL = "http://localhost:8080/api/v1";

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export type ApiErrorCode =
  // contract (ErrorResponse)
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "CURRENT_PASSWORD_INCORRECT"
  | "UNSUPPORTED_FILE"
  | "DUPLICATE_VALUE"
  | "INVALID_STATE"
  | "ROLE_POLICY_VIOLATION"
  | "POLICY_VERSION_IMMUTABLE"
  | "IMPORT_EXPIRED"
  | "PRECONDITION_FAILED"
  // gaps (openapi-gaps.ts)
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_DISABLED"
  | "ACCOUNT_LOCKED"
  | "ROLE_MISSING"
  | "PASSWORD_CHANGE_REQUIRED"
  | "SERVICE_UNAVAILABLE"
  // client-only
  | "NETWORK_ERROR"
  | "UNKNOWN";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fieldErrors: Record<string, string>;
  readonly retryAfterSeconds?: number;
  /** Raw field problems as sent (`errors[]` or the hub's `payload.data.details[]`), incl. per-field codes. */
  readonly details: ReadonlyArray<{ field: string; code?: string; message: string }>;

  constructor(init: {
    status: number;
    code: ApiErrorCode;
    message?: string;
    fieldErrors?: Record<string, string>;
    retryAfterSeconds?: number;
    details?: ReadonlyArray<{ field: string; code?: string; message: string }>;
  }) {
    super(init.message ?? init.code);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.fieldErrors = init.fieldErrors ?? {};
    this.retryAfterSeconds = init.retryAfterSeconds;
    this.details = init.details ?? [];
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

type TokenProvider = () => string | null;
type Handler = () => void;

let tokenProvider: TokenProvider | null = null;
let unauthorizedHandler: Handler | null = null;
let accountDisabledHandler: Handler | null = null;
let passwordChangeRequiredHandler: Handler | null = null;

export function setTokenProvider(provider: TokenProvider | null): void {
  tokenProvider = provider;
}
export function setUnauthorizedHandler(handler: Handler | null): void {
  unauthorizedHandler = handler;
}
export function setAccountDisabledHandler(handler: Handler | null): void {
  accountDisabledHandler = handler;
}
export function setPasswordChangeRequiredHandler(handler: Handler | null): void {
  passwordChangeRequiredHandler = handler;
}

const KNOWN_CODES = new Set<string>([
  "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "VALIDATION_FAILED",
  "CURRENT_PASSWORD_INCORRECT", "UNSUPPORTED_FILE", "DUPLICATE_VALUE", "INVALID_STATE",
  "ROLE_POLICY_VIOLATION", "POLICY_VERSION_IMMUTABLE", "IMPORT_EXPIRED", "PRECONDITION_FAILED",
  "INVALID_CREDENTIALS", "ACCOUNT_DISABLED", "ACCOUNT_LOCKED", "ROLE_MISSING",
  "PASSWORD_CHANGE_REQUIRED", "SERVICE_UNAVAILABLE",
]);

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "DUPLICATE_VALUE";
  if (status === 412) return "PRECONDITION_FAILED";
  if (status === 503) return "SERVICE_UNAVAILABLE";
  if (status === 400 || status === 422) return "VALIDATION_FAILED";
  return "UNKNOWN";
}

async function toApiError(response: Response): Promise<ApiError> {
  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfter = retryAfterHeader !== null ? Number(retryAfterHeader) : NaN;
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  const record = (typeof body === "object" && body !== null ? body : {}) as {
    code?: unknown;
    message?: unknown;
    errors?: unknown;
    payload?: { message?: unknown; data?: { details?: unknown } | null };
  };
  // Two error shapes (docs-changes DOC-16): the contract ErrorResponse `{ code, message, errors[] }`
  // and the backend ServiceResponse `{ payload: { message, data: { details[] } } }` used by the hub.
  const rawDetails = Array.isArray(record.errors)
    ? record.errors
    : Array.isArray(record.payload?.data?.details)
      ? record.payload.data.details
      : [];
  const details: { field: string; code?: string; message: string }[] = [];
  const fieldErrors: Record<string, string> = {};
  for (const entry of rawDetails) {
    if (entry && typeof entry === "object") {
      const { field, code: fieldCode, message } = entry as { field?: unknown; code?: unknown; message?: unknown };
      if (typeof field === "string" && typeof message === "string") {
        details.push({ field, message, ...(typeof fieldCode === "string" ? { code: fieldCode } : {}) });
        fieldErrors[field] = message;
      }
    }
  }
  const detailCode = details.find((d) => d.code !== undefined && KNOWN_CODES.has(d.code))?.code;
  const code: ApiErrorCode =
    typeof record.code === "string" && KNOWN_CODES.has(record.code)
      ? (record.code as ApiErrorCode)
      : detailCode !== undefined
        ? (detailCode as ApiErrorCode)
        : body === null && response.status >= 500 && response.status !== 503
          ? "UNKNOWN"
          : codeFromStatus(response.status);
  const message =
    typeof record.message === "string"
      ? record.message
      : typeof record.payload?.message === "string"
        ? record.payload.message
        : code;
  return new ApiError({
    status: response.status,
    code,
    message,
    fieldErrors,
    details,
    retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : undefined,
  });
}

type RequestOptions = Omit<RequestInit, "body" | "method"> & {
  body?: unknown;
  /** Skip the session callbacks (used by login, where 401/403 are form errors). */
  skipSessionHandlers?: boolean;
};

type ReadOptions = Omit<RequestOptions, "body">;

export interface ApiResponse<T> {
  data: T;
  headers: Headers;
}

async function send<T>(
  endpoint: string,
  method: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { body: rawBody, skipSessionHandlers, ...init } = options;
  const baseUrl = getApiBaseUrl();
  const url = /^https?:\/\//.test(endpoint) ? endpoint : `${baseUrl}${endpoint}`;
  const headers = new Headers(init.headers);
  let body: BodyInit | undefined;

  if (rawBody !== undefined) {
    if (rawBody instanceof FormData || typeof rawBody === "string") {
      body = rawBody;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(rawBody);
    }
  }

  // The bearer token is attached ONLY to the configured API origin (spec FR-010).
  const token = tokenProvider?.();
  if (token && url.startsWith(baseUrl)) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, method, headers, body });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw cause;
    }
    throw new ApiError({ status: 0, code: "NETWORK_ERROR" });
  }

  if (!response.ok) {
    const error = await toApiError(response);
    if (!skipSessionHandlers) {
      if (error.status === 401) {
        unauthorizedHandler?.();
      } else if (error.code === "ACCOUNT_DISABLED") {
        accountDisabledHandler?.();
      } else if (error.code === "PASSWORD_CHANGE_REQUIRED") {
        passwordChangeRequiredHandler?.();
      }
    }
    throw error;
  }

  if (response.status === 204) {
    return { data: undefined as T, headers: response.headers };
  }

  return { data: (await response.json()) as T, headers: response.headers };
}

/** Unwraps the contract envelope `{ success, data }`. */
export function unwrap<T>(envelope: { data?: T }): T {
  if (envelope.data === undefined) {
    throw new ApiError({ status: 200, code: "UNKNOWN" });
  }
  return envelope.data;
}

/**
 * The backend's `ServiceResponse` envelope, used by the University Services Hub instead of the
 * contract's `{ success, data }` (docs/api/openapi-changes.md API-GAP-HUB-01, docs-changes DOC-16).
 */
export interface ServiceResponseEnvelope<T> {
  success: boolean;
  statusCode: number;
  payload: { message: string; data?: T };
}

/**
 * The single adapter for the hub envelope. When the backend adopts the contract envelope,
 * only this function (and the error parsing above) changes.
 */
export function unwrapServiceResponse<T>(envelope: ServiceResponseEnvelope<T> | undefined): T {
  const data = envelope?.payload?.data;
  if (data === undefined) {
    throw new ApiError({ status: 200, code: "UNKNOWN" });
  }
  return data;
}

/** The version in an `ETag: "<version>"` header (weak or strong), or null when absent or not numeric. */
export function versionFromEtag(headers: Headers): number | null {
  const match = headers.get("ETag")?.match(/^(?:W\/)?"(\d+)"$/);
  return match ? Number(match[1]) : null;
}

export const api = {
  get: async <T>(endpoint: string, options?: ReadOptions) =>
    (await send<T>(endpoint, "GET", options)).data,
  post: async <T>(endpoint: string, body?: unknown, options?: ReadOptions) =>
    (await send<T>(endpoint, "POST", { ...options, body })).data,
  put: async <T>(endpoint: string, body?: unknown, options?: ReadOptions) =>
    (await send<T>(endpoint, "PUT", { ...options, body })).data,
  patch: async <T>(endpoint: string, body?: unknown, options?: ReadOptions) =>
    (await send<T>(endpoint, "PATCH", { ...options, body })).data,
  delete: async <T>(endpoint: string, options?: ReadOptions) =>
    (await send<T>(endpoint, "DELETE", options)).data,
  /** Same as the verbs above but also returns headers (e.g. `ETag`). */
  request: <T>(endpoint: string, method: string, options?: RequestOptions) =>
    send<T>(endpoint, method, options),
};
