import { HttpResponse } from "msw";

/**
 * The backend's `ServiceResponse` envelope (src/server/src/types/ServiceResponse.ts), used by the hub
 * endpoints instead of the contract envelope (API-GAP-HUB-01, docs-changes DOC-16):
 * `{ success, statusCode, payload: { message: "<text> (<STATUS>)", data } }`.
 */
const STATUS_NAME: Record<number, string> = {
  200: "OK",
  201: "CREATED",
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "METHOD_NOT_ALLOWED",
  409: "CONFLICT",
  412: "PRECONDITION_FAILED",
  415: "UNSUPPORTED_MEDIA_TYPE",
  503: "SERVICE_UNAVAILABLE",
};

export interface HubFieldError {
  field: string;
  code: string;
  message: string;
}

function envelope(success: boolean, status: number, text: string, data?: unknown) {
  return {
    success,
    statusCode: status,
    payload: { message: `${text} (${STATUS_NAME[status] ?? "ERROR"})`, ...(data !== undefined ? { data } : {}) },
  };
}

export function hubOk<T>(data: T, status = 200, headers?: Record<string, string>) {
  return HttpResponse.json(envelope(true, status, status === 201 ? "Created" : "OK", data), { status, headers });
}

/** Errors: field problems go in `payload.data.details[]`, as the hub controller sends them. */
export function hubFail(status: number, text: string, details?: HubFieldError[] | Record<string, unknown>) {
  return HttpResponse.json(envelope(false, status, text, details !== undefined ? { details } : undefined), { status });
}
