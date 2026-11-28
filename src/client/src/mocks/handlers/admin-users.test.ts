import { describe, expect, it } from "vitest";
import { readDb, setMockFailures } from "@/mocks/db/store";
import { issueToken } from "@/mocks/utils/token";

const BASE = "http://localhost:8080/api/v1";
const tokenFor = (email: string) => issueToken(readDb().users.find((u) => u.email === email)!).token;
const admin = () => tokenFor("admin@example.invalid");

function post(body: unknown, token = admin()) {
  return fetch(`${BASE}/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

const student = {
  email: "an.nguyen@example.invalid",
  fullName: "Nguyễn Văn An",
  role: "student",
  studentNumber: "23127555",
  facultyId: "120",
  phoneNumber: null,
  initialPassword: "KHTN@NVA7555",
};

describe("POST /admin/users (US6)", () => {
  it.each([
    student,
    { ...student, email: "m@example.invalid", role: "manager", studentNumber: null, facultyId: null, initialPassword: "KHTN@TTB1234" },
    { ...student, email: "a@example.invalid", role: "administrator", studentNumber: null, facultyId: null, initialPassword: "KHTN@LQH1234" },
  ])("creates a $role account that must set a new password and can sign in", async (body) => {
    const res = await post(body);
    expect(res.status).toBe(201);
    const created = (await res.json()).data;
    expect(created).toMatchObject({ email: body.email, role: body.role, status: "active", version: 1 });
    expect(readDb().users.find((u) => u.email === body.email)?.mustChangePassword).toBe(true);

    const login = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.initialPassword }),
    });
    expect(login.status).toBe(200);
  });

  it("A11: rejects more than one role", async () => {
    const res = await post({ ...student, role: ["student", "manager"] });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_FAILED");
    expect(body.errors[0].field).toBe("role");
  });

  it("A6: rejects student fields for a manager (ROLE_POLICY_VIOLATION)", async () => {
    const res = await post({ ...student, email: "x@example.invalid", role: "manager" });
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("ROLE_POLICY_VIOLATION");
  });

  it("rejects a duplicate email (any case) and a duplicate student number", async () => {
    const dupEmail = await post({ ...student, email: "STUDENT1@example.invalid" });
    expect(dupEmail.status).toBe(409);
    expect((await dupEmail.json()).errors[0].field).toBe("email");

    const dupNumber = await post({ ...student, studentNumber: "23127001" });
    expect(dupNumber.status).toBe(409);
    expect((await dupNumber.json()).errors[0].field).toBe("studentNumber");
  });

  it("is forbidden for non-administrators", async () => {
    expect((await post(student, tokenFor("manager1@example.invalid"))).status).toBe(403);
  });

  it("A9: a failure leaves the store unchanged", async () => {
    setMockFailures(["createUser"]);
    const before = readDb().users.length;
    expect((await post(student)).status).toBe(500);
    expect(readDb().users.length).toBe(before);
  });
});

describe("reference data", () => {
  const get = (path: string) => fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${admin()}` } });

  it("lists faculties, roles and role permissions", async () => {
    expect((await (await get("/admin/faculties")).json()).data.length).toBeGreaterThan(0);
    const roles = (await (await get("/admin/roles")).json()).data;
    expect(roles.map((r: { code: string }) => r.code)).toEqual(["student", "manager", "administrator"]);
    const perms = (await (await get("/admin/roles/role-administrator/permissions")).json()).data;
    expect(perms.permissions.map((p: { code: string }) => p.code)).toContain("role.manage");
    expect((await get("/admin/roles/role-x/permissions")).status).toBe(404);
  });
});

describe("GET /admin/users (US5)", () => {
  const list = (query = "", token = admin()) =>
    fetch(`${BASE}/admin/users${query}`, { headers: { Authorization: `Bearer ${token}` } });

  it("sorts newest first, pages by 10 and reports pagination", async () => {
    const body = (await (await list("?limit=10&page=1&sortBy=createdAt&sortOrder=desc")).json()).data;
    expect(body.pagination).toEqual({ page: 1, limit: 10, totalItems: 6, totalPages: 1 });
    expect(body.items[0].email).toBe("newuser@example.invalid");
    expect(body.items[0].permissions).toBeUndefined();
  });

  it("searches name, email and student number case-insensitively, and filters by role", async () => {
    const byName = (await (await list("?search=nguy%E1%BB%85n")).json()).data.items;
    expect(byName.map((u: { email: string }) => u.email)).toEqual(["student1@example.invalid"]);
    expect((await (await list("?search=23127002")).json()).data.items[0].email).toBe("disabled@example.invalid");
    expect((await (await list("?search=MANAGER1")).json()).data.items).toHaveLength(1);
    expect((await (await list("?role=administrator")).json()).data.items).toHaveLength(1);
  });

  it("is forbidden for non-admins and fails with the switch", async () => {
    expect((await list("", tokenFor("student1@example.invalid"))).status).toBe(403);
    setMockFailures(["listUsers"]);
    expect((await list()).status).toBe(500);
  });
});
