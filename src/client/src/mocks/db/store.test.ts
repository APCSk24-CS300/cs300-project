import { beforeEach, describe, expect, it } from "vitest";
import { MOCK_DB_KEY, readDb, resetMockDb, setMockFailures, updateDb } from "@/mocks/db/store";
import { OUTAGE_EMAIL } from "@/mocks/db/seed";

describe("mock store", () => {
  beforeEach(() => resetMockDb());

  it("seeds six stored users and no outage user", () => {
    const db = readDb();
    expect(db.users.map((u) => u.email)).toEqual([
      "student1@example.invalid",
      "manager1@example.invalid",
      "admin@example.invalid",
      "disabled@example.invalid",
      "norole@example.invalid",
      "newuser@example.invalid",
    ]);
    expect(db.users.some((u) => u.email === OUTAGE_EMAIL)).toBe(false);
    expect(db.users.every((u) => u.passwordPlain === "demo2026")).toBe(true);
    expect(db.faculties.some((f) => f.id === "120")).toBe(true);
  });

  it("persists writes in localStorage across reads", () => {
    updateDb((db) => {
      db.users[0].fullName = "Changed";
    });
    expect(JSON.parse(window.localStorage.getItem(MOCK_DB_KEY) ?? "{}").users[0].fullName).toBe("Changed");
    expect(readDb().users[0].fullName).toBe("Changed");
  });

  it("re-seeds on a corrupted or unknown-version store", () => {
    window.localStorage.setItem(MOCK_DB_KEY, JSON.stringify({ version: 99 }));
    expect(readDb().users).toHaveLength(6);
    window.localStorage.setItem(MOCK_DB_KEY, "{not json");
    expect(readDb().users).toHaveLength(6);
  });

  it("stores the failure switch", () => {
    setMockFailures(["createUser", "login:network"]);
    expect(readDb().failures).toEqual(["createUser", "login:network"]);
  });
  it("adds the hub links to an older store and keeps users and sessions", () => {
    // A store written before plan 005: no service links, no hub permissions, one signed-in session.
    const old = readDb() as unknown as Record<string, unknown> & {
      users: { fullName: string }[];
      issuedTokens: Record<string, string>;
      permissions: { code: string }[];
      rolePermissions: Record<string, string[]>;
    };
    delete old.serviceLinks;
    delete old.nextServiceLinkId;
    old.permissions = old.permissions.filter((p) => !p.code.startsWith("hub."));
    for (const id of Object.keys(old.rolePermissions)) {
      old.rolePermissions[id] = old.rolePermissions[id].filter((c) => !c.startsWith("hub."));
    }
    old.users[0].fullName = "Kept";
    old.issuedTokens["jti-kept"] = "user-001";
    window.localStorage.setItem(MOCK_DB_KEY, JSON.stringify(old));

    const db = readDb();
    expect(db.users[0].fullName).toBe("Kept");
    expect(db.issuedTokens["jti-kept"]).toBe("user-001");
    expect(db.serviceLinks.map((l) => l.name)).toContain("Moodle");
    expect(db.nextServiceLinkId).toBe(8);
    expect(db.rolePermissions["role-student"]).toContain("hub.services.read");
    expect(db.rolePermissions["role-administrator"]).toEqual(expect.arrayContaining(["hub.services.read", "hub.services.manage"]));
    expect(db.rolePermissions["role-manager"]).not.toContain("hub.services.manage");
    // The migration is written back once and is idempotent.
    expect(JSON.parse(window.localStorage.getItem(MOCK_DB_KEY) ?? "{}").serviceLinks).toHaveLength(7);
    expect(readDb().permissions.filter((p) => p.code.startsWith("hub."))).toHaveLength(2);
  });

  it("does not re-grant hub permissions that were removed after the migration", () => {
    updateDb((db) => {
      db.rolePermissions["role-student"] = db.rolePermissions["role-student"].filter((c) => c !== "hub.services.read");
    });
    expect(readDb().rolePermissions["role-student"]).not.toContain("hub.services.read");
  });
  it("adds avatarUrl to an older store's users and keeps sessions", () => {
    // A store written before plan 006: users without avatarUrl, one signed-in session.
    const old = readDb() as unknown as { users: Record<string, unknown>[]; issuedTokens: Record<string, string> };
    for (const u of old.users) delete u.avatarUrl;
    old.users[0].fullName = "Kept";
    old.issuedTokens["jti-kept"] = "user-001";
    window.localStorage.setItem(MOCK_DB_KEY, JSON.stringify(old));

    const db = readDb();
    expect(db.users.every((u) => u.avatarUrl === null)).toBe(true);
    expect(db.users[0].fullName).toBe("Kept");
    expect(db.issuedTokens["jti-kept"]).toBe("user-001");
    expect(JSON.parse(window.localStorage.getItem(MOCK_DB_KEY) ?? "{}").users[0]).toHaveProperty("avatarUrl", null);

    // Runs once: a later avatar value is not reset by the next read.
    updateDb((d) => {
      d.users[0].avatarUrl = "/api/v1/profile/avatar/files/x.png";
    });
    expect(readDb().users[0].avatarUrl).toBe("/api/v1/profile/avatar/files/x.png");
  });
});
