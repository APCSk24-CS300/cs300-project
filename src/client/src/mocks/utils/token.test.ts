import { beforeEach, describe, expect, it } from "vitest";
import { decodeJwt } from "jose";
import { readDb, resetMockDb, updateDb } from "@/mocks/db/store";
import { issueToken, verifyToken } from "@/mocks/utils/token";

describe("mock token", () => {
  beforeEach(() => resetMockDb());

  it("mirrors the server claims (sub, name, 1-hour exp) plus jti", () => {
    const user = readDb().users[0];
    const { token, expiresAt } = issueToken(user);
    const claims = decodeJwt(token);
    expect(claims.sub).toBe(user.id);
    expect(claims.name).toBe(user.fullName);
    expect(typeof claims.jti).toBe("string");
    expect((claims.exp as number) - Math.floor(Date.now() / 1000)).toBeGreaterThan(3590);
    expect(new Date(expiresAt).getTime()).toBe((claims.exp as number) * 1000);
    expect(verifyToken(token)?.sub).toBe(user.id);
  });

  it("rejects revoked, forged and malformed tokens", () => {
    const { token } = issueToken(readDb().users[0]);
    const { jti } = decodeJwt(token);
    updateDb((db) => {
      db.revokedTokenIds.push(jti as string);
    });
    expect(verifyToken(token)).toBeNull();

    resetMockDb();
    expect(verifyToken(token)).toBeNull(); // jti not issued by this store
    expect(verifyToken("garbage")).toBeNull();
    expect(verifyToken(null)).toBeNull();
  });
});
