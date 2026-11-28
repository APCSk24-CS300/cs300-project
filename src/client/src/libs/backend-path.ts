/**
 * Backend paths the /api/backend forwarder may reach: exactly the operations this client calls
 * (no open proxy). `path` is relative to the backend's /api/v1 base, already URL-encoded per segment.
 *
 * - hub/services[/{id}]                               University Services Hub (UC-07)
 * - admin/services[/{id}]                             service-link administration (BR-ADM-01)
 * - auth/login | auth/logout | auth/me                UC-01 / UC-02 (003)
 * - profile/password                                  first-sign-in password change (003)
 * - admin/users[...] | admin/faculties | admin/roles[...]   account administration (UC-29, 003)
 * - activities/landing                                landing activities
 */
const EXACT = new Set(["auth/login", "auth/logout", "auth/me", "profile/password", "admin/faculties", "activities/landing"]);
const PREFIXES = [["hub", "services"], ["admin", "services"], ["admin", "users"], ["admin", "roles"]];

export function isAllowedBackendPath(path: string): boolean {
  const segments = path.split("/");
  if (segments.some((s) => s === "" || s === "." || s === ".." || s.toLowerCase().includes("%2e%2e"))) {
    return false;
  }
  if (EXACT.has(path)) return true;
  return PREFIXES.some((prefix) => prefix.every((part, i) => segments[i] === part));
}

/** Sign-in and session paths: the dev fallback token is never attached to them. */
export function isAuthPath(path: string): boolean {
  return path.split("/")[0] === "auth";
}
