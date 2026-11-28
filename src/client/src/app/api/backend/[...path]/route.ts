// Forwards browser requests to the backend REST API (specs/004-university-service-hub research R-01).
// The browser calls /api/backend/<path>; this handler calls `${BACKEND_API_URL}/<path>` with a Bearer
// token, so the token never reaches browser JavaScript and the backend needs no CORS setup.
//
// Login/logout belong to the Authentication group and do not issue backend tokens yet. Until they do,
// the token comes from the server-only DEV_BACKEND_TOKEN env var (minted with
// src/server/scripts/mint-dev-token.ts). Replace `backendToken()` once real sessions exist.
import type { NextRequest } from "next/server";
import { isAllowedBackendPath } from "@/libs/backend-path";

/** Request headers passed on to the backend. */
const FORWARD_REQUEST_HEADERS = ["content-type", "if-match", "accept"];
/** Response headers passed back to the browser. */
const FORWARD_RESPONSE_HEADERS = ["content-type", "etag", "location", "allow", "retry-after"];

type Context = { params: Promise<{ path: string[] }> };

/** DEV ONLY: the backend token to use. Never used in production builds. */
function backendToken(): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  const token = process.env.DEV_BACKEND_TOKEN?.trim();
  return token ? token : undefined;
}

function envelope(status: number, message: string) {
  return Response.json({ success: false, statusCode: status, payload: { message } }, { status });
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

  const token = backendToken();
  if (!token) {
    return envelope(401, "No backend token configured (set DEV_BACKEND_TOKEN)");
  }

  const headers = new Headers({ Authorization: `Bearer ${token}` });
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
export const PATCH = forward;
export const DELETE = forward;
