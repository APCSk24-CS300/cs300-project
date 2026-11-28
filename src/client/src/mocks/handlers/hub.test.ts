import { describe, expect, it } from "vitest";
import { readDb, setMockFailures, updateDb } from "@/mocks/db/store";
import { issueToken } from "@/mocks/utils/token";

/**
 * The MSW hub handlers must answer like src/server HubRoute / HubController
 * (specs 004 contracts/hub-api.md). Scenario map: specs/005-integrate-hub/coverage.md.
 */
const BASE = "http://localhost:8080/api/v1";
const tokenFor = (email: string) => issueToken(readDb().users.find((u) => u.email === email)!).token;
const ADMIN = "admin@example.invalid";
const STUDENT = "student1@example.invalid";
const MANAGER = "manager1@example.invalid";

type Init = { method?: string; body?: unknown; token?: string | null; headers?: Record<string, string> };

function call(path: string, { method = "GET", body, token = tokenFor(ADMIN), headers = {} }: Init = {}) {
  return fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function payload(res: Response) {
  return ((await res.json()) as { success: boolean; statusCode: number; payload: { message: string; data?: unknown } })
    .payload;
}

async function names(res: Response) {
  return ((await payload(res)).data as { name: string }[]).map((l) => l.name);
}

const ACTIVE_SEED = [
  "Moodle",
  "Student Portal",
  "Course Registration Portal",
  "Special Programs Portal",
  "Tuition Payment",
  "Student Handbook 2025",
];

describe("hub handlers: GET /hub/services (US1)", () => {
  it("lists only active links in hub order for every role", async () => {
    updateDb((db) => {
      // Tie on displayOrder: then lower-case name, then id.
      db.serviceLinks.push(
        { id: "20", name: "beta", url: "https://b.edu", description: null, displayOrder: 1, isActive: true, version: 1 },
        { id: "21", name: "Alpha", url: "https://a.edu", description: null, displayOrder: 1, isActive: true, version: 1 },
      );
    });
    for (const email of [STUDENT, MANAGER, ADMIN]) {
      const res = await call("/hub/services", { token: tokenFor(email) });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean; statusCode: number; payload: { message: string; data: unknown[] } };
      expect(body).toMatchObject({ success: true, statusCode: 200, payload: { message: "OK (OK)" } });
      expect((body.payload.data as { name: string }[]).map((l) => l.name)).toEqual(["Alpha", "beta", "Moodle", ...ACTIVE_SEED.slice(1)]);
      expect(body.payload.data[0]).toEqual({
        id: "21", name: "Alpha", url: "https://a.edu", description: null, displayOrder: 1, isActive: true, version: 1,
      });
    }
  });

  it("returns an empty list when no link is active", async () => {
    updateDb((db) => db.serviceLinks.forEach((l) => (l.isActive = false)));
    const res = await call("/hub/services", { token: tokenFor(STUDENT) });
    expect(res.status).toBe(200);
    expect((await payload(res)).data).toEqual([]);
  });

  it("GET /hub/services/{id} answers 404 for inactive, unknown and non-numeric ids", async () => {
    expect((await payload(await call("/hub/services/1"))).data).toMatchObject({ id: "1", name: "Moodle" });
    for (const id of ["7", "999", "abc", "0", "-1"]) {
      const res = await call(`/hub/services/${id}`);
      expect(res.status, id).toBe(404);
      expect(await res.json()).toMatchObject({ success: false, statusCode: 404 });
    }
    // PATCH on an unknown link is also 404.
    expect((await call("/admin/services/999", { method: "PATCH", body: { name: "x" } })).status).toBe(404);
  });

  it("answers 500 and a network error through the failure switch", async () => {
    setMockFailures(["listServices"]);
    expect((await call("/hub/services")).status).toBe(500);
    setMockFailures(["listServices:network"]);
    await expect(call("/hub/services")).rejects.toThrow();
    setMockFailures([]);
  });
});

describe("hub handlers: /admin/services (US3)", () => {
  it("answers 403 to students and managers on every admin endpoint and 401 without a token", async () => {
    const requests: [string, Init][] = [
      ["/admin/services", {}],
      ["/admin/services", { method: "POST", body: { name: "X", url: "https://x.edu" } }],
      ["/admin/services/1", { method: "PATCH", body: { name: "X" } }],
      ["/admin/services/1", { method: "DELETE" }],
    ];
    for (const email of [STUDENT, MANAGER]) {
      for (const [path, init] of requests) {
        const res = await call(path, { ...init, token: tokenFor(email) });
        expect(res.status, `${email} ${init.method ?? "GET"} ${path}`).toBe(403);
        expect(await res.json()).toMatchObject({ success: false, statusCode: 403 });
      }
    }
    for (const [path, init] of requests) {
      expect((await call(path, { ...init, token: null })).status).toBe(401);
    }
    expect((await call("/hub/services", { token: null })).status).toBe(401);
    expect(readDb().serviceLinks.find((l) => l.id === "1")).toMatchObject({ name: "Moodle", isActive: true, version: 1 });
  });

  it("GET /admin/services lists inactive links too, and rejects a bad includeInactive", async () => {
    expect(await names(await call("/admin/services"))).toEqual([...ACTIVE_SEED, "HCMUS"]);
    expect(await names(await call("/admin/services?includeInactive=true"))).toEqual([...ACTIVE_SEED, "HCMUS"]);
    expect(await names(await call("/admin/services?includeInactive=false"))).toEqual(ACTIVE_SEED);
    const bad = await call("/admin/services?includeInactive=yes");
    expect(bad.status).toBe(400);
    expect((await payload(bad)).data).toEqual({
      details: [{ field: "includeInactive", code: "INVALID_TYPE", message: "Use true or false" }],
    });
  });

  it("POST /admin/services creates a link last, with 201, ETag and Location", async () => {
    const res = await call("/admin/services", {
      method: "POST",
      body: { name: "  E-learning  ", url: " https://elearning.hcmus.edu.vn ", description: "   ", reason: "new" },
    });
    expect(res.status).toBe(201);
    const created = (await payload(res)).data as { id: string };
    expect(created).toEqual({
      id: "8", name: "E-learning", url: "https://elearning.hcmus.edu.vn", description: null,
      displayOrder: 8, isActive: true, version: 1,
    });
    expect(res.headers.get("ETag")).toBe('"1"');
    expect(res.headers.get("Location")).toBe("/api/v1/admin/services/8");
    expect(readDb().serviceLinks).toHaveLength(8);
  });

  it("rejects unsafe URLs and bad fields with 400 and per-field codes", async () => {
    for (const url of ["javascript:alert(1)", "ftp://x", "moodle.hcmus.edu.vn", "https://user:pass@host.edu", "https://a b.edu", `https://x.edu/${"a".repeat(2048)}`]) {
      const res = await call("/admin/services", { method: "POST", body: { name: "Bad", url } });
      expect(res.status, url).toBe(400);
      const details = ((await payload(res)).data as { details: { field: string; code: string }[] }).details;
      expect(details, url).toEqual([expect.objectContaining({ field: "url", code: expect.stringMatching(/INVALID_URL|TOO_LONG/) })]);
    }
    const res = await call("/admin/services", {
      method: "POST",
      body: { name: " ", url: "", description: "x".repeat(501), displayOrder: 10000, isActive: "yes", extra: 1 },
    });
    expect(res.status).toBe(400);
    const codes = ((await payload(res)).data as { details: { field: string; code: string }[] }).details.map((d) => `${d.field}:${d.code}`);
    expect(codes.sort()).toEqual(
      ["description:TOO_LONG", "displayOrder:OUT_OF_RANGE", "extra:UNKNOWN_FIELD", "isActive:INVALID_TYPE", "name:REQUIRED", "url:REQUIRED"].sort(),
    );
    expect(readDb().serviceLinks).toHaveLength(7);
  });

  it("answers 415 when a body is not JSON", async () => {
    const res = await fetch(`${BASE}/admin/services`, {
      method: "POST",
      headers: { "Content-Type": "text/plain", Authorization: `Bearer ${tokenFor(ADMIN)}` },
      body: "name=x",
    });
    expect(res.status).toBe(415);
  });

  it("PATCH needs at least one known field and rejects unknown ones", async () => {
    const empty = await call("/admin/services/2", { method: "PATCH", body: {} });
    expect(empty.status).toBe(400);
    expect((await payload(empty)).data).toEqual({
      details: [{ field: "(body)", code: "EMPTY_UPDATE", message: "Change at least one field" }],
    });
    const unknown = await call("/admin/services/2", { method: "PATCH", body: { colour: "red" } });
    expect(unknown.status).toBe(400);
    expect(JSON.stringify((await payload(unknown)).data)).toContain("UNKNOWN_FIELD");
  });

  it("answers 409 DUPLICATE_VALUE for a taken name on create and update", async () => {
    const create = await call("/admin/services", { method: "POST", body: { name: " MOODLE ", url: "https://m.edu" } });
    expect(create.status).toBe(409);
    expect((await payload(create)).data).toEqual({
      details: [{ field: "name", code: "DUPLICATE_VALUE", message: "A service with this name already exists" }],
    });
    const update = await call("/admin/services/2", { method: "PATCH", body: { name: "moodle" } });
    expect(update.status).toBe(409);
    // Renaming a link to its own name in another case is allowed.
    expect((await call("/admin/services/1", { method: "PATCH", body: { name: "MOODLE" } })).status).toBe(200);
  });

  it("answers 412 for a stale or malformed If-Match and changes nothing", async () => {
    const first = await call("/admin/services/2", { method: "PATCH", body: { description: "x" }, headers: { "If-Match": '"1"' } });
    expect(first.status).toBe(200);
    expect(first.headers.get("ETag")).toBe('"2"');

    const stale = await call("/admin/services/2", { method: "PATCH", body: { description: "y" }, headers: { "If-Match": '"1"' } });
    expect(stale.status).toBe(412);
    expect((await payload(stale)).data).toEqual({ details: { currentVersion: 2 } });
    expect((await call("/admin/services/2", { method: "DELETE", headers: { "If-Match": '"1"' } })).status).toBe(412);
    expect((await call("/admin/services/2", { method: "PATCH", body: { name: "y" }, headers: { "If-Match": "abc" } })).status).toBe(412);
    expect(readDb().serviceLinks.find((l) => l.id === "2")).toMatchObject({ description: "x", isActive: true, version: 2 });

    // Without If-Match there is no check (the contract makes it optional).
    expect((await call("/admin/services/2", { method: "PATCH", body: { description: "z" } })).status).toBe(200);
  });

  it("PATCH that changes nothing returns the current link and version", async () => {
    const res = await call("/admin/services/1", { method: "PATCH", body: { name: "Moodle", isActive: true } });
    expect(res.status).toBe(200);
    expect((await payload(res)).data).toMatchObject({ id: "1", version: 1 });
    expect(res.headers.get("ETag")).toBe('"1"');
  });

  it("DELETE deactivates without deleting; a second DELETE is a no-op; PATCH isActive reactivates", async () => {
    const off = await call("/admin/services/1", { method: "DELETE", headers: { "If-Match": '"1"' } });
    expect(off.status).toBe(200);
    expect((await payload(off)).data).toMatchObject({ id: "1", isActive: false, version: 2 });
    expect(off.headers.get("ETag")).toBe('"2"');
    expect(readDb().serviceLinks).toHaveLength(7);

    const again = await call("/admin/services/1", { method: "DELETE" });
    expect(again.status).toBe(200);
    expect((await payload(again)).data).toMatchObject({ isActive: false, version: 2 });

    const on = await call("/admin/services/1", { method: "PATCH", body: { isActive: true }, headers: { "If-Match": '"2"' } });
    expect(on.status).toBe(200);
    expect((await payload(on)).data).toMatchObject({ isActive: true, version: 3 });
  });

  it("a link the admin adds or deactivates shows in the hub for every role", async () => {
    await call("/admin/services", { method: "POST", body: { name: "HCMUS Library", url: "https://library.hcmus.edu.vn" } });
    await call("/admin/services/1", { method: "DELETE" });
    for (const email of [STUDENT, MANAGER, ADMIN]) {
      expect(await names(await call("/hub/services", { token: tokenFor(email) }))).toEqual([...ACTIVE_SEED.slice(1), "HCMUS Library"]);
    }
  });
});
