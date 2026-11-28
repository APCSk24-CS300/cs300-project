import { getDashboardPath } from "@/libs/navigation";
import { getRoleForPath } from "@/libs/roles";
import type { SessionHint } from "@/libs/session-hint";

/**
 * Pure route-guard rules (contracts/ui-routes-and-components.md §2). Used by both
 * src/proxy.ts (server, hint cookie) and RequireSession (client). Cosmetic only: the API
 * enforces access (constitution IV, FR-021).
 */
export type RouteAccess =
  | { type: "allow"; noStore: boolean }
  | { type: "redirect"; to: string };

export const CHANGE_PASSWORD_PATH = "/change-password";

/** Signed-in paths outside the role areas; any role may open them. `/services` = UC-07 hub. */
export const UNIVERSITY_SERVICES_PATH = "/services";
/** UC-03 "My profile", shared by every role (plan 006 O9). */
export const PROFILE_PATH = "/profile";
const PROTECTED_SHARED_PATHS = [CHANGE_PASSWORD_PATH, "/forbidden", UNIVERSITY_SERVICES_PATH, PROFILE_PATH];

export function isProtectedPath(pathname: string): boolean {
  return (
    getRoleForPath(pathname) !== null ||
    PROTECTED_SHARED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

export function resolveRouteAccess(
  pathname: string,
  hint: SessionHint | null,
  nowSeconds: number,
  search = "",
): RouteAccess {
  const validHint = hint && hint.exp > nowSeconds ? hint : null;

  // Rule 1: public paths.
  if (!isProtectedPath(pathname)) {
    if ((pathname === "/login" || pathname.startsWith("/login/")) && validHint) {
      return {
        type: "redirect",
        to: validHint.mustChangePassword ? CHANGE_PASSWORD_PATH : getDashboardPath(validHint.role),
      };
    }
    return { type: "allow", noStore: false };
  }

  // Rule 2: no (valid) session.
  if (!validHint) {
    return {
      type: "redirect",
      to: `/login?redirectTo=${encodeURIComponent(pathname + search)}`,
    };
  }

  const isChangePassword = pathname === CHANGE_PASSWORD_PATH;

  // Rule 3: password change pending.
  if (validHint.mustChangePassword && !isChangePassword) {
    return { type: "redirect", to: CHANGE_PASSWORD_PATH };
  }

  // Rule 4: nothing to change.
  if (isChangePassword && !validHint.mustChangePassword) {
    return { type: "redirect", to: getDashboardPath(validHint.role) };
  }

  // Rule 5: another role's area.
  const owner = getRoleForPath(pathname);
  if (owner !== null && owner !== validHint.role) {
    return { type: "redirect", to: "/forbidden" };
  }

  // Rule 6: allowed; protected responses must not be cached (UC-02 A4).
  return { type: "allow", noStore: true };
}
