import { createSeed } from "@/mocks/db/seed";
import type { MockDb, OperationId } from "@/mocks/db/types";

/** Persistent mock store (research R3): survives reloads so admin-created accounts can sign in. */
export const MOCK_DB_KEY = "myhcmus:mock-db:v1";

let memoryFallback: MockDb | null = null;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readDb(): MockDb {
  const store = storage();
  if (!store) {
    memoryFallback ??= createSeed();
    return memoryFallback;
  }
  try {
    const raw = store.getItem(MOCK_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb;
      if (parsed && parsed.version === 1) {
        return parsed;
      }
    }
  } catch {
    // corrupted -> re-seed below
  }
  const seed = createSeed();
  writeDb(seed);
  return seed;
}

export function writeDb(db: MockDb): void {
  const store = storage();
  if (!store) {
    memoryFallback = db;
    return;
  }
  try {
    store.setItem(MOCK_DB_KEY, JSON.stringify(db));
  } catch {
    memoryFallback = db;
  }
}

/** Read-modify-write helper. */
export function updateDb<T>(mutate: (db: MockDb) => T): T {
  const db = readDb();
  const result = mutate(db);
  writeDb(db);
  return result;
}

export function resetMockDb(): void {
  memoryFallback = null;
  writeDb(createSeed());
}

export function setMockFailures(failures: OperationId[]): void {
  updateDb((db) => {
    db.failures = [...failures];
  });
}
