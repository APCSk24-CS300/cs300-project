import { decodeJwt } from "jose";
import { beforeEach, describe, expect, it } from "vitest";
import { mockDevTools } from "@/mocks/dev-tools";
import { readDb, setMockFailures } from "@/mocks/db/store";

const BASE = "http://localhost:8080/api/v1";

async function login(email: string, password = "demo2026") {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return { res, body: await res.json() };
}

async function me(token?: string) {
  const res = await fetch(`${BASE}/auth/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { res, body: await res.json() };
}

describe("mock auth handlers — happy path (US1)", () => {
  it.each(["student1@example.invalid", "manager1@example.invalid", "admin@example.invalid"])(
    "issues a 1-hour bearer token in the body for %s",
    async (email) => {
      const { res, body } = await login(email);
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      const claims = decodeJwt(body.data.token);
      expect(claims).toMatchObject({ sub: expect.any(String), name: expect.any(String), jti: expect.any(String) });
      expect((claims.exp as number) - Date.now() / 1000).toBeGreaterThan(3500);
      expect(typeof body.data.expiresAt).toBe("string");
    },
  );

  it("returns the profile, role and permissions from /auth/me", async () => {
    const { body } = await login("student1@example.invalid");
    const { res, body: ctx } = await me(body.data.token);
    expect(res.status).toBe(200);
    expect(ctx.data.user).toMatchObject({ email: "student1@example.invalid", role: "student", status: "active" });
    expect(ctx.data.user.academicInfo.studentNumber).toBe("23127001");
    expect(ctx.data.permissions).toContain("registration.create");
  });

  it("returns role null and status inactive instead of 403 (H2)", async () => {
    const norole = await login("norole@example.invalid");
    expect((await me(norole.body.data.token)).body.data.user.role).toBeNull();

    const { body } = await login("student1@example.invalid");
    mockDevTools.disable("student1@example.invalid");
    const ctx = await me(body.data.token);
    expect(ctx.res.status).toBe(200);
    expect(ctx.body.data.user.status).toBe("inactive");
  });

  it("rejects /auth/me without a token", async () => {
    const { res, body } = await me();
    expect(res.status).toBe(401);
    expect(body.code).toBe("UNAUTHENTICATED");
  });
});

describe("mock auth handlers — failures (US2)", () => {
  beforeEach(() => setMockFailures([]));

  it("answers unknown email and wrong password identically", async () => {
    const unknown = await login("nobody@example.invalid");
    const wrong = await login("student1@example.invalid", "wrong-pass");
    expect(unknown.res.status).toBe(401);
    expect(wrong.res.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
    expect(unknown.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("denies a disabled account", async () => {
    const { res, body } = await login("disabled@example.invalid");
    expect(res.status).toBe(403);
    expect(body.code).toBe("ACCOUNT_DISABLED");
  });

  it("locks after 5 consecutive failures, also for unknown emails, and resets on success", async () => {
    for (let i = 0; i < 4; i += 1) {
      expect((await login("manager1@example.invalid", "bad")).res.status).toBe(401);
    }
    const fifth = await login("manager1@example.invalid", "bad");
    expect(fifth.res.status).toBe(423);
    expect(Number(fifth.res.headers.get("Retry-After"))).toBeLessThanOrEqual(900);
    const locked = await login("manager1@example.invalid");
    expect(locked.res.status).toBe(423);
    expect(locked.body.code).toBe("ACCOUNT_LOCKED");

    for (let i = 0; i < 5; i += 1) await login("ghost@example.invalid", "bad");
    expect((await login("ghost@example.invalid", "bad")).res.status).toBe(423);

    for (let i = 0; i < 3; i += 1) await login("student1@example.invalid", "bad");
    expect((await login("student1@example.invalid")).res.status).toBe(200);
    expect(readDb().loginAttempts["student1@example.invalid"]).toBeUndefined();
  });

  it("returns 503 for the outage rule, which is not a stored user", async () => {
    const { res, body } = await login("outage@example.invalid");
    expect(res.status).toBe(503);
    expect(body.code).toBe("SERVICE_UNAVAILABLE");
    expect(readDb().users.some((u) => u.email === "outage@example.invalid")).toBe(false);
  });

  it("simulates a network failure", async () => {
    setMockFailures(["login:network"]);
    await expect(login("student1@example.invalid")).rejects.toThrow();
  });
});

describe("mock auth handlers — logout (US3)", () => {
  it("revokes the token on logout", async () => {
    const { body } = await login("student1@example.invalid");
    const token = body.data.token;
    const out = await fetch(`${BASE}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    expect(out.status).toBe(200);
    expect((await me(token)).res.status).toBe(401);
    const again = await fetch(`${BASE}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    expect(again.status).toBe(401);
  });

  it("expireSessions invalidates every issued token", async () => {
    const a = (await login("student1@example.invalid")).body.data.token;
    const b = (await login("admin@example.invalid")).body.data.token;
    mockDevTools.expireSessions();
    expect((await me(a)).res.status).toBe(401);
    expect((await me(b)).res.status).toBe(401);
  });

  it("answers ACCOUNT_DISABLED on other calls once disabled, while /auth/me still answers (H2/H3)", async () => {
    const token = (await login("admin@example.invalid")).body.data.token;
    mockDevTools.disable("admin@example.invalid");
    const list = await fetch(`${BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
    expect(list.status).toBe(403);
    expect((await list.json()).code).toBe("ACCOUNT_DISABLED");
    expect((await me(token)).body.data.user.status).toBe("inactive");
  });
});
