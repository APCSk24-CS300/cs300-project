// Same-origin forwarder to the backend REST API for real mode (plan 005 §6, approved Q1;
// docs-changes DOC-17). The backend has no CORS, so the browser calls /api/backend/<path> and this
// handler calls `${BACKEND_API_URL}/<path>`.
//
// Token: the signed-in user's bearer, which the API client attaches, is passed on unchanged.
// DEV ONLY fallback: when NODE_ENV is not production AND ALLOW_DEV_BACKEND_TOKEN=true AND the request
// has no Authorization header (and is not a sign-in/session call), DEV_BACKEND_TOKEN is used and a
// warning is logged each time. Off by default, so permission bugs are not hidden by everyone acting
// as one seeded user. Without any token the request is forwarded as is and the backend answers 401.
import type { NextRequest } from "next/server";
import { isAllowedBackendPath, isAuthPath } from "@/libs/backend-path";

/** Request headers passed on to the backend. */
const FORWARD_REQUEST_HEADERS = ["content-type", "if-match", "accept"];
/** Response headers passed back to the browser. */
const FORWARD_RESPONSE_HEADERS = ["content-type", "etag", "location", "allow", "retry-after", "www-authenticate"];

type Context = { params: Promise<{ path: string[] }> };

function envelope(status: number, message: string) {
  return Response.json({ success: false, statusCode: status, payload: { message } }, { status });
}

/** DEV ONLY opt-in fallback token (see the header comment). */
function devFallbackToken(path: string, method: string): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  if (process.env.ALLOW_DEV_BACKEND_TOKEN !== "true") return undefined;
  if (isAuthPath(path)) return undefined;
  const token = process.env.DEV_BACKEND_TOKEN?.trim();
  if (!token) return undefined;
  console.warn(`[api/backend] DEV_BACKEND_TOKEN used for ${method} /${path} (no Authorization header; ALLOW_DEV_BACKEND_TOKEN=true)`);
  return token;
}

async function forward(request: NextRequest, context: Context): Promise<Response> {
  const segments = (await context.params).path ?? [];
  const path = segments.map((s) => encodeURIComponent(s)).join("/");
  if (!isAllowedBackendPath(path)) {
    return envelope(404, "Not found");
  }

  const base = process.env.BACKEND_API_URL;
  if (!base) {
    return envelope(500, "BACKEND_API_URL is not set");
  }

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("Authorization", authorization);
  } else {
    const fallback = devFallbackToken(path, request.method);
    if (fallback) headers.set("Authorization", `Bearer ${fallback}`);
  }
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, name === "content-type" ? value.split(";")[0]!.trim() : value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(`${base.replace(/\/$/, "")}/${path}${request.nextUrl.search}`, {
      method: request.method,
      headers,
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return envelope(502, "The backend could not be reached, please try again");
  }

  const responseHeaders = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new Response(upstream.status === 204 ? null : await upstream.text(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
