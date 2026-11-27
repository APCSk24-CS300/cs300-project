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
});
