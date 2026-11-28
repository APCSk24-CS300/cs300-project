import { describe, expect, it } from "vitest";
import { mockDevTools } from "@/mocks/dev-tools";
import { readDb, setMockFailures } from "@/mocks/db/store";
import { issueToken } from "@/mocks/utils/token";

const BASE = "http://localhost:8080/api/v1";
const tokenFor = (email: string) => issueToken(readDb().users.find((u) => u.email === email)!).token;
const get = (path: string, token?: string) =>
  fetch(`${BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

describe("withAuth guard order (contracts/mock-api.md)", () => {
  it("401 without a valid token", async () => {
    expect((await get("/admin/users")).status).toBe(401);
    expect((await get("/admin/users", "forged.token.x")).status).toBe(401);
  });

  it("1. inactive → 403 ACCOUNT_DISABLED", async () => {
    const res = await get("/admin/faculties", tokenFor("disabled@example.invalid"));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("ACCOUNT_DISABLED");
  });

  it("2. role null → 403 FORBIDDEN", async () => {
    const res = await get("/admin/users", tokenFor("norole@example.invalid"));
    expect((await res.json()).code).toBe("FORBIDDEN");
  });

  it("3. mustChangePassword → 403 PASSWORD_CHANGE_REQUIRED", async () => {
    mockDevTools.setRole("newuser@example.invalid", "administrator");
    const res = await get("/admin/users", tokenFor("newuser@example.invalid"));
    expect((await res.json()).code).toBe("PASSWORD_CHANGE_REQUIRED");
  });

  it("4. role mismatch → 403 FORBIDDEN", async () => {
    const res = await get("/admin/users", tokenFor("student1@example.invalid"));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("FORBIDDEN");
  });

  it("/auth/me skips the account checks", async () => {
    expect((await get("/auth/me", tokenFor("disabled@example.invalid"))).status).toBe(200);
    expect((await get("/auth/me", tokenFor("newuser@example.invalid"))).status).toBe(200);
  });

  it("failure switch returns 500 without touching the store", async () => {
    setMockFailures(["listUsers"]);
    const before = JSON.stringify(readDb().users);
    const res = await get("/admin/users", tokenFor("admin@example.invalid"));
    expect(res.status).toBe(500);
    expect(JSON.stringify(readDb().users)).toBe(before);
  });
});
