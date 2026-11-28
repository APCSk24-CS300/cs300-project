import { decodeJwt } from "jose";

/**
 * Bearer token storage (spec FR-010, research R2).
 * Mirrors src/server: the token comes in the login response body and is sent only as
 * `Authorization: Bearer`. It lives in localStorage and is NEVER written to a cookie.
 */
export const TOKEN_STORAGE_KEY = "myhcmus:token";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Epoch seconds at which a JWT expires, or null when it can't be read. */
export function readTokenExp(token: string): number | null {
  try {
    const { exp } = decodeJwt(token);
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function getToken(): string | null {
  const store = storage();
  if (!store) {
    return null;
  }
  let token: string | null = null;
  try {
    token = store.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!token) {
    return null;
  }
  const exp = readTokenExp(token);
  if (exp === null || exp <= nowSeconds()) {
    clearToken();
    return null;
  }
  return token;
}

export function getTokenExp(): number | null {
  const token = getToken();
  return token ? readTokenExp(token) : null;
}

export function setToken(token: string): void {
  try {
    storage()?.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage unavailable: the user stays signed out on reload.
  }
}

export function clearToken(): void {
  try {
    storage()?.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Notifies when the token is removed or changed in ANOTHER tab (spec FR-018b).
 * Returns an unsubscribe function.
 */
export function subscribeToken(callback: (token: string | null) => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const handler = (event: StorageEvent) => {
    if (event.key === TOKEN_STORAGE_KEY || event.key === null) {
      callback(event.newValue);
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
