import { isRoleCode, type RoleCode } from "@/libs/roles";

/**
 * Non-sensitive route-guard hint (spec FR-010, research R2). It is the ONLY cookie the
 * client writes and contains no token. It grants nothing: every API call needs the token.
 */
export const SESSION_HINT_COOKIE = "myhcmus_session";

export interface SessionHint {
  role: RoleCode;
  mustChangePassword: boolean;
  /** Epoch seconds; equals the token expiry. */
  exp: number;
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeHint(hint: SessionHint): string {
  return toBase64Url(JSON.stringify(hint));
}

/** Parses a hint cookie value. Returns null when it is invalid, has an unknown role, or is expired. */
export function parseHint(
  value: string | null | undefined,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): SessionHint | null {
  if (!value) {
    return null;
  }
  try {
    const raw: unknown = JSON.parse(fromBase64Url(value));
    if (typeof raw !== "object" || raw === null) {
      return null;
    }
    const { role, mustChangePassword, exp } = raw as Record<string, unknown>;
    if (!isRoleCode(role) || typeof exp !== "number" || exp <= nowSeconds) {
      return null;
    }
    return { role, mustChangePassword: mustChangePassword === true, exp };
  } catch {
    return null;
  }
}

function cookieAttributes(maxAgeSeconds: number): string {
  const secure =
    typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  return `; Path=/; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}${secure}`;
}

export function writeHint(hint: SessionHint): void {
  if (typeof document === "undefined") {
    return;
  }
  const maxAge = hint.exp - Math.floor(Date.now() / 1000);
  document.cookie = `${SESSION_HINT_COOKIE}=${encodeHint(hint)}${cookieAttributes(maxAge)}`;
}

export function readHint(): SessionHint | null {
  if (typeof document === "undefined") {
    return null;
  }
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_HINT_COOKIE}=`));
  return parseHint(entry?.slice(SESSION_HINT_COOKIE.length + 1));
}

export function clearHint(): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${SESSION_HINT_COOKIE}=${cookieAttributes(0)}`;
}
