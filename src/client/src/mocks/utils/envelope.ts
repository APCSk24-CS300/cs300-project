import { HttpResponse } from "msw";

/** Contract envelope helpers: `{ success, data }` and `ErrorResponse { success:false, code, message, errors? }`. */
export function ok<T>(data: T, status = 200, headers?: Record<string, string>) {
  return HttpResponse.json({ success: true, data }, { status, headers });
}

export function message(text: string, status = 200) {
  return HttpResponse.json({ success: true, message: text }, { status });
}

export function fail(
  status: number,
  code: string,
  text: string,
  errors?: { field: string; code?: string; message: string }[],
  headers?: Record<string, string>,
) {
  return HttpResponse.json(
    { success: false, code, message: text, ...(errors ? { errors } : {}) },
    { status, headers },
  );
}
