import { describe, expect, it } from "vitest";
import { readDb } from "@/mocks/db/store";
import { mockDevTools } from "@/mocks/dev-tools";
import { issueToken } from "@/mocks/utils/token";

const BASE = "http://localhost:8080/api/v1";
const tokenFor = (email: string) => issueToken(readDb().users.find((u) => u.email === email)!).token;

const change = (token: string, currentPassword: string, newPassword: string) =>
  fetch(`${BASE}/profile/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

const login = (email: string, password: string) =>
  fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

describe("PATCH /profile/password (US7)", () => {
  it("rejects a wrong current password", async () => {
    const res = await change(tokenFor("newuser@example.invalid"), "wrong", "NewPass123");
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("CURRENT_PASSWORD_INCORRECT");
  });

  it("rejects a new password under 8 characters", async () => {
    const res = await change(tokenFor("newuser@example.invalid"), "demo2026", "short");
    expect((await res.json()).code).toBe("VALIDATION_FAILED");
  });

  it("changes the password, clears the mark, old password stops working", async () => {
    const res = await change(tokenFor("newuser@example.invalid"), "demo2026", "NewPass123");
    expect(res.status).toBe(200);
    expect(readDb().users.find((u) => u.email === "newuser@example.invalid")?.mustChangePassword).toBe(false);
    expect((await login("newuser@example.invalid", "demo2026")).status).toBe(401);
    expect((await login("newuser@example.invalid", "NewPass123")).status).toBe(200);
  });

  it("blocks other operations while a change is pending, but not /auth/me or logout", async () => {
    mockDevTools.setRole("newuser@example.invalid", "administrator");
    const token = tokenFor("newuser@example.invalid");
    const list = await fetch(`${BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
    expect(list.status).toBe(403);
    expect((await list.json()).code).toBe("PASSWORD_CHANGE_REQUIRED");
    expect((await fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })).status).toBe(200);
    expect((await fetch(`${BASE}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })).status).toBe(200);
  });
});
