import { UnsecuredJWT } from "jose";
import { readDb, updateDb } from "@/mocks/db/store";
import type { MockUser } from "@/mocks/db/types";

export const TOKEN_LIFETIME_SECONDS = 3600;

export interface MockClaims {
  sub: string;
  name: string;
  jti: string;
  exp: number;
}

function randomId(): string {
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Issues a JWT with the same claims as src/server (`sub`, `name`, 1-hour `exp`) plus `jti`.
 * Mock-only: the token is unsigned; authenticity comes from the store's list of issued `jti`s.
 */
export function issueToken(user: MockUser): { token: string; expiresAt: string } {
  const jti = randomId();
  const exp = Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS;
  const token = new UnsecuredJWT({ name: user.fullName })
    .setSubject(user.id)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(exp)
    .encode();
  updateDb((db) => {
    db.issuedTokens[jti] = user.id;
  });
  return { token, expiresAt: new Date(exp * 1000).toISOString() };
}

/** Returns the claims of a token the mock issued, or null if forged, expired or revoked. */
export function verifyToken(token: string | null | undefined): MockClaims | null {
  if (!token) {
    return null;
  }
  try {
    const { payload } = UnsecuredJWT.decode(token);
    const { sub, jti, exp } = payload;
    if (typeof sub !== "string" || typeof jti !== "string" || typeof exp !== "number") {
      return null;
    }
    if (exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    const db = readDb();
    if (db.issuedTokens[jti] !== sub || db.revokedTokenIds.includes(jti)) {
      return null;
    }
    return { sub, jti, exp, name: typeof payload.name === "string" ? payload.name : "" };
  } catch {
    return null;
  }
}

export function bearerFrom(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}
