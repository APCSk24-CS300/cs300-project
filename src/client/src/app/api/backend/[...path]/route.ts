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
import { MAX_FORWARDED_BODY_BYTES, isAllowedBackendPath, isAuthPath } from "@/libs/backend-path";

/** Request headers passed on to the backend. `content-type` is kept whole (the multipart boundary). */
const FORWARD_REQUEST_HEADERS = ["content-type", "if-match", "accept"];
/** Response headers passed back to the browser (incl. the avatar file read). */
const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "etag",
  "location",
  "allow",
  "retry-after",
  "www-authenticate",
  "cache-control",
  "x-content-type-options",
];

class BodyTooLarge extends Error {}

/** Reads the body as bytes (never as text: multipart and images must stay byte-exact), within the limit. */
async function readBoundedBody(request: NextRequest): Promise<Uint8Array | undefined> {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > MAX_FORWARDED_BODY_BYTES) throw new BodyTooLarge();
  if (!request.body) return undefined;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_FORWARDED_BODY_BYTES) {
      await reader.cancel();
      throw new BodyTooLarge();
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

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
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let body: Uint8Array | undefined;
  if (hasBody) {
    try {
      body = await readBoundedBody(request);
    } catch (error) {
      if (error instanceof BodyTooLarge) {
        return envelope(413, "The request is too large. A profile picture can be up to 10 MB.");
      }
      return envelope(400, "The request body could not be read");
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${base.replace(/\/$/, "")}/${path}${request.nextUrl.search}`, {
      method: request.method,
      headers,
      body: body && body.byteLength > 0 ? (body as BodyInit) : undefined,
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
  // Streamed through unchanged (bytes, not text): image responses must stay byte-exact.
  return new Response(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
