import { NextResponse, type NextRequest } from "next/server";
import { resolveRouteAccess } from "@/libs/route-access";
import { SESSION_HINT_COOKIE, parseHint } from "@/libs/session-hint";

/**
 * Route guard (Next 16 Proxy; must live beside `app/`). Reads ONLY the non-sensitive hint
 * cookie — never a token — and only redirects (constitution IV). The API enforces access.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hint = parseHint(request.cookies.get(SESSION_HINT_COOKIE)?.value);
  const access = resolveRouteAccess(pathname, hint, Math.floor(Date.now() / 1000), search);

  if (access.type === "redirect") {
    return NextResponse.redirect(new URL(access.to, request.url));
  }

  const response = NextResponse.next();
  if (access.noStore) {
    // UC-02 A4: protected pages must not be restored from cache after logout.
    response.headers.set("Cache-Control", "no-store, max-age=0");
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|mockServiceWorker.js|images/).*)"],
};
