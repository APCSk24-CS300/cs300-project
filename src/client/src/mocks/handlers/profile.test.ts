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

// ---- UC-03 profile and avatar (plan 006 step 4; scenario map: specs/006-integrate-profile/coverage.md) ----

const STUDENT = "student1@example.invalid";
const MANAGER = "manager1@example.invalid";
const PNG = (extra = 4): Uint8Array<ArrayBuffer> => new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, ...new Array<number>(extra).fill(1)]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

type CallInit = { method?: string; token?: string | null; json?: unknown; body?: BodyInit; headers?: Record<string, string> };

function call(path: string, init: CallInit = {}) {
  const { method = "GET", token = tokenFor(STUDENT), json, body, headers = {} } = init;
  return fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : body,
  });
}

function upload(bytes: Uint8Array<ArrayBuffer>, opts: { name?: string; type?: string; field?: string; token?: string } = {}) {
  const form = new FormData();
  form.append(opts.field ?? "avatar", new File([bytes], opts.name ?? "me.png", { type: opts.type ?? "image/png" }));
  return call("/profile/avatar", { method: "POST", body: form, token: opts.token ?? tokenFor(STUDENT) });
}

const serviceData = async (res: Response) => ((await res.json()) as { payload: { data?: unknown; message: string } }).payload;
const student = () => readDb().users.find((u) => u.email === STUDENT)!;
const savedUrl = async (res: Response) => ((await res.json()) as { data: { avatarUrl: string } }).data.avatarUrl;

describe("GET/PATCH /profile (UC-03 US1)", () => {
  it("GET /profile returns the caller's own profile in the ServiceResponse envelope", async () => {
    const res = await call("/profile");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, statusCode: 200, payload: { message: "OK (OK)" } });
    expect(body.payload.data).toEqual({
      id: "user-001",
      email: STUDENT,
      fullName: "Nguyễn Văn An",
      phoneNumber: null,
      avatarUrl: null,
      academicInfo: {
        studentNumber: "23127001",
        faculty: { id: "120", code: "CIT", name: "Computer and Information Technology field" },
        major: null,
        enrollmentYear: null,
      },
    });
    expect((await serviceData(await call("/profile", { token: tokenFor(MANAGER) }))).data).toMatchObject({
      email: MANAGER,
      academicInfo: null,
    });
  });

  it("PATCH /profile saves a valid phone number or clears it with null", async () => {
    const saved = await call("/profile", { method: "PATCH", json: { phoneNumber: "+84901234567" } });
    expect(saved.status).toBe(200);
    expect((await serviceData(saved)).data).toMatchObject({ phoneNumber: "+84901234567" });
    expect(student().phoneNumber).toBe("+84901234567");
    expect((await serviceData(await call("/profile"))).data).toMatchObject({ phoneNumber: "+84901234567" });

    const cleared = await call("/profile", { method: "PATCH", json: { phoneNumber: null } });
    expect((await serviceData(cleared)).data).toMatchObject({ phoneNumber: null });
    expect(student().phoneNumber).toBeNull();
  });

  it("PATCH /profile rejects an invalid phone with 400 and a { field } detail, and changes nothing", async () => {
    for (const phoneNumber of ["090123456", "84901234567", "0901 234 567", 901234567, ""]) {
      const res = await call("/profile", { method: "PATCH", json: { phoneNumber } });
      expect(res.status, String(phoneNumber)).toBe(400);
      expect(await serviceData(res)).toEqual({
        message: "Phone number must be 10 digits starting with 0 or +84 followed by 9 digits (BAD_REQUEST)",
        data: { details: { field: "phoneNumber" } },
      });
    }
    expect(student().phoneNumber).toBeNull();
  });

  it("answers 409 for a phone number another account uses, in either format", async () => {
    await call("/profile", { method: "PATCH", json: { phoneNumber: "0901234567" }, token: tokenFor(MANAGER) });
    for (const phoneNumber of ["0901234567", "+84901234567"]) {
      const res = await call("/profile", { method: "PATCH", json: { phoneNumber } });
      expect(res.status, phoneNumber).toBe(409);
      expect(await serviceData(res)).toEqual({
        message: "Phone number is already in use (CONFLICT)",
        data: { details: { field: "phoneNumber" } },
      });
    }
    const own = await call("/profile", { method: "PATCH", json: { phoneNumber: "+84901234567" }, token: tokenFor(MANAGER) });
    expect(own.status).toBe(200); // the owner may save their own number in the other format
  });

  it("PATCH /profile accepts phoneNumber only; read-only fields are rejected and nothing changes", async () => {
    const before = { ...student() };
    for (const json of [{ fullName: "X" }, { phoneNumber: "0901234567", studentNumber: "1" }, { faculty: "x" }, { email: "x@y" }]) {
      const res = await call("/profile", { method: "PATCH", json });
      expect(res.status).toBe(400);
      expect((await serviceData(res)).message).toBe("Only phoneNumber may be updated (BAD_REQUEST)");
    }
    expect((await serviceData(await call("/profile", { method: "PATCH", json: {} }))).message).toBe(
      "phoneNumber is required (BAD_REQUEST)",
    );
    expect((await serviceData(await call("/profile", { method: "PATCH", json: [1] }))).message).toBe(
      "A profile update object is required (BAD_REQUEST)",
    );
    expect(student()).toMatchObject({
      fullName: before.fullName,
      email: before.email,
      studentNumber: before.studentNumber,
      phoneNumber: null,
    });
  });

  it("every profile operation uses the token's user; there is no user id in the path or body", async () => {
    await call("/profile", { method: "PATCH", json: { phoneNumber: "0911111111" }, token: tokenFor(MANAGER) });
    expect(readDb().users.find((u) => u.email === MANAGER)!.phoneNumber).toBe("0911111111");
    expect(student().phoneNumber).toBeNull();
    // Targeting another user is just an unsupported field (there is no per-user profile path at all).
    expect((await call("/profile", { method: "PATCH", json: { id: "user-002", phoneNumber: "0922222222" } })).status).toBe(400);
    expect(readDb().users.find((u) => u.id === "user-002")!.phoneNumber).toBe("0911111111");
  });

  it("answers 401 without a token on every profile operation", async () => {
    const form = new FormData();
    form.append("avatar", new File([PNG()], "a.png", { type: "image/png" }));
    const requests: [string, CallInit][] = [
      ["/profile", {}],
      ["/profile", { method: "PATCH", json: { phoneNumber: null } }],
      ["/profile/password", { method: "PATCH", json: { currentPassword: "a", newPassword: "abcdefgh" } }],
      ["/profile/avatar", { method: "POST", body: form }],
      ["/profile/avatar", { method: "DELETE" }],
      ["/profile/avatar/files/x.png", {}],
    ];
    for (const [path, init] of requests) {
      expect((await call(path, { ...init, token: null })).status, `${init.method ?? "GET"} ${path}`).toBe(401);
    }
  });

  it("password responses never contain password values", async () => {
    const token = tokenFor(STUDENT);
    const responses = [
      await change(token, "wrong-pass", "new-password-1"),
      await change(token, "demo2026", "short"),
      await change(token, "demo2026", "new-password-1"),
    ];
    for (const res of responses) {
      const text = await res.text();
      for (const secret of ["wrong-pass", "demo2026", "new-password-1", "short"]) expect(text).not.toContain(secret);
    }
  });
});

describe("POST/DELETE /profile/avatar and the file read (UC-03 US3)", () => {
  it("POST /profile/avatar stores a PNG or JPEG up to 10 MiB inclusive and returns its URL", async () => {
    const res = await upload(PNG());
    expect(res.status).toBe(200);
    const url = await savedUrl(res);
    expect(url).toMatch(/^\/api\/v1\/profile\/avatar\/files\/[0-9a-f-]{36}\.png$/);
    expect(student().avatarUrl).toBe(url);

    expect(await savedUrl(await upload(JPEG, { name: "me.jpg", type: "image/jpeg" }))).toMatch(/\.jpg$/);

    const exact = new Uint8Array(10 * 1024 * 1024);
    exact.set(PNG(0));
    expect((await upload(exact)).status).toBe(200);
  });

  it("rejects content that is not JPG/PNG (renamed file), a 10 MiB + 1 byte file, an empty file and a missing field with 400 UNSUPPORTED_FILE", async () => {
    const kept = await savedUrl(await upload(PNG()));
    const tooBig = new Uint8Array(10 * 1024 * 1024 + 1);
    tooBig.set(PNG(0));
    const cases: Response[] = [
      await upload(new Uint8Array(new TextEncoder().encode("not an image")), { name: "photo.png", type: "image/png" }),
      await upload(new Uint8Array([0x47, 0x49, 0x46, 0x38]), { name: "x.gif", type: "image/gif" }),
      await upload(tooBig),
      await upload(new Uint8Array(0)),
      await upload(PNG(), { field: "picture" }),
      await call("/profile/avatar", { method: "POST", json: { avatar: "x" } }),
    ];
    for (const res of cases) {
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ success: false, code: "UNSUPPORTED_FILE" });
    }
    expect(student().avatarUrl).toBe(kept); // the current picture is kept (A8)
  });

  it("GET /profile/avatar/files/{name} returns the bytes of the current picture only", async () => {
    const url = await savedUrl(await upload(PNG(6)));
    const name = url.split("/").pop()!;
    const read = await call(`/profile/avatar/files/${name}`);
    expect(read.status).toBe(200);
    expect(read.headers.get("content-type")).toBe("image/png");
    expect(read.headers.get("cache-control")).toBe("private, no-store");
    expect(new Uint8Array(await read.arrayBuffer()).slice(0, 8)).toEqual(PNG(0));

    expect((await call(`/profile/avatar/files/${name}`, { token: tokenFor(MANAGER) })).status).toBe(404); // not theirs
    await upload(PNG(2));
    expect((await call(`/profile/avatar/files/${name}`)).status).toBe(404); // replaced
  });

  it("DELETE /profile/avatar clears the picture; the file is gone", async () => {
    const url = await savedUrl(await upload(PNG()));
    const res = await call("/profile/avatar", { method: "DELETE" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, message: "Avatar removed successfully" });
    expect(student().avatarUrl).toBeNull();
    expect((await call(url.replace("/api/v1", ""))).status).toBe(404);
    expect((await serviceData(await call("/profile"))).data).toMatchObject({ avatarUrl: null });
  });

  it("answers 500 and 409 through the failure switch and keeps the current picture", async () => {
    const url = await savedUrl(await upload(PNG()));
    mockDevTools.fail("uploadAvatar");
    expect((await upload(PNG(3))).status).toBe(500);
    mockDevTools.clearFailures();
    mockDevTools.fail("uploadAvatar:conflict");
    expect((await upload(PNG(3))).status).toBe(409);
    mockDevTools.clearFailures();
    mockDevTools.fail("removeAvatar:conflict");
    expect((await call("/profile/avatar", { method: "DELETE" })).status).toBe(409);
    mockDevTools.clearFailures();
    mockDevTools.fail("removeAvatar");
    expect((await call("/profile/avatar", { method: "DELETE" })).status).toBe(500);
    mockDevTools.clearFailures();
    expect(student().avatarUrl).toBe(url);
    expect((await call(`/profile/avatar/files/${url.split("/").pop()!}`)).status).toBe(200);
  });
});
