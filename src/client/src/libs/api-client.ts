const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

type RequestOptions = Omit<RequestInit, "body" | "method"> & {
  body?: unknown;
};

/** One field problem reported by the backend (`payload.data.details[]` on 400/409). */
export type ApiFieldError = { field: string; code: string; message: string };

/**
 * Thrown for every non-2xx response. `status` is the HTTP status; `fieldErrors` holds the backend's
 * field-level problems when it sent any; `details` is the raw `payload.data.details` value.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: ApiFieldError[];
  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.fieldErrors = Array.isArray(details)
      ? details.filter(
          (d): d is ApiFieldError =>
            typeof d === "object" && d !== null && "field" in d && "code" in d,
        )
      : [];
  }
}

function readDetails(errorText: string): unknown {
  try {
    const parsed = JSON.parse(errorText) as { payload?: { data?: { details?: unknown } } };
    return parsed?.payload?.data?.details;
  } catch {
    return undefined;
  }
}

/** A parsed body together with the response's ETag header (admin resources use it for If-Match). */
export type ApiResult<T> = { body: T; etag: string | null };

type ReadOptions = Omit<RequestOptions, "body" | "method">;

async function apiRequest<T>(
  endpoint: string,
  method: string,
  options: RequestOptions = {},
): Promise<T> {
  return (await apiRequestWithMeta<T>(endpoint, method, options)).body;
}

async function apiRequestWithMeta<T>(
  endpoint: string,
  method: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  if (API_BASE_URL == null || API_BASE_URL == undefined) {
    throw new Error("API_BASE_URL is not defined");
  } else if (API_BASE_URL == "http://localhost:3000") {
    console.warn(
      "NEXT_PUBLIC_API_BASE_URL is not set. Using default value: http://localhost:3000",
    );
  }

  const headers = new Headers(options.headers);
  const url = endpoint.startsWith("/api/v1/profile") || endpoint.startsWith("/api/auth/")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;
  let body: BodyInit | undefined;

  if (options.body != undefined) {
    if (options.body instanceof FormData || typeof options.body === "string") {
      body = options.body;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(url, { ...options, method, headers, body });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      response.status,
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
      readDetails(errorText),
    );
  }

  const etag = response.headers.get("ETag");

  if (response.status === 204) {
    return { body: undefined as T, etag };
  }

  return { body: (await response.json()) as T, etag };
}

export const api = {
  get: <T>(endpoint: string, options?: ReadOptions) =>
    apiRequest<T>(endpoint, "GET", options),
  post: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, "POST", { body }),
  put: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, "PUT", { body }),
  patch: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, "PATCH", { body }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, "DELETE"),
  /** Like the methods above, but with extra headers (e.g. If-Match) and the ETag of the response. */
  request: <T>(
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    endpoint: string,
    options?: RequestOptions,
  ) => apiRequestWithMeta<T>(endpoint, method, options),
};
