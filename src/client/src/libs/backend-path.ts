/**
 * Backend paths the /api/backend forwarder may reach (no open proxy). `path` is relative to the
 * backend's /api/v1 base, already URL-encoded per segment.
 */
export function isAllowedBackendPath(path: string): boolean {
  const segments = path.split("/");
  if (segments.some((s) => s === "" || s === "." || s === ".." || s.toLowerCase().includes("%2e%2e"))) {
    return false;
  }
  if (segments[0] === "hub" && segments.length >= 2) return true;
  return segments[0] === "admin" && segments[1] === "services";
}
