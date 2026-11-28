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
 * - profile | profile/avatar | profile/avatar/files/{name}   UC-03 (plan 006); `profile/password` above
 */
const EXACT = new Set([
  "auth/login",
  "auth/logout",
  "auth/me",
  "profile",
  "profile/password",
  "profile/avatar",
  "admin/faculties",
  "activities/landing",
]);
/** One avatar file name, as the BE makes them (`{uuid}.png|jpg`): no dots-only, no separators. */
const AVATAR_FILE = /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9]+)?$/;
const PREFIXES = [["hub", "services"], ["admin", "services"], ["admin", "users"], ["admin", "roles"]];

export function isAllowedBackendPath(path: string): boolean {
  const segments = path.split("/");
  if (segments.some((s) => s === "" || s === "." || s === ".." || s.toLowerCase().includes("%2e%2e"))) {
    return false;
  }
  if (EXACT.has(path)) return true;
  if (segments.length === 4 && segments[0] === "profile" && segments[1] === "avatar" && segments[2] === "files") {
    return AVATAR_FILE.test(segments[3]!);
  }
  return PREFIXES.some((prefix) => prefix.every((part, i) => segments[i] === part));
}

/**
 * Largest request body the /api/backend forwarder passes on: the 10 MiB avatar (UC-03 A3, BR-ACC-10) plus
 * 64 KiB for the multipart framing, as the BE AvatarRoute allows. Larger bodies get 413 without calling
 * the backend; the BE still decides on the file itself (400 UNSUPPORTED_FILE). Bodies are buffered up to
 * this size (plan 006 R4; a production deployment would stream). Lives here because a Next route file
 * may only export its handlers.
 */
export const MAX_FORWARDED_BODY_BYTES = 10 * 1024 * 1024 + 64 * 1024;

/** Sign-in and session paths: the dev fallback token is never attached to them. */
export function isAuthPath(path: string): boolean {
  return path.split("/")[0] === "auth";
}
