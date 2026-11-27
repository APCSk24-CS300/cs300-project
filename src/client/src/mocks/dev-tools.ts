import type { RoleCode } from "@/libs/roles";
import { readDb, resetMockDb, setMockFailures, updateDb } from "@/mocks/db/store";
import type { OperationId } from "@/mocks/db/types";

export interface MockDevTools {
  reset(): void;
  fail(op: OperationId): void;
  clearFailures(): void;
  /** Revokes every issued token: the next request returns 401 (UC-02 A2, FR-018). */
  expireSessions(): void;
  /** Sets a stored user to inactive (GAP-N demo). */
  disable(email: string): void;
  /** Sets a stored user's role, `null` for the role-missing case (FR-007 on reload). */
  setRole(email: string, role: RoleCode | null): void;
}

function findAndUpdate(email: string, mutate: (u: ReturnType<typeof readDb>["users"][number]) => void) {
  updateDb((db) => {
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (user) {
      mutate(user);
      user.version += 1;
    }
  });
}

export const mockDevTools: MockDevTools = {
  reset: () => resetMockDb(),
  fail: (op) => setMockFailures([...readDb().failures.filter((f) => f !== op), op]),
  clearFailures: () => setMockFailures([]),
  expireSessions: () =>
    updateDb((db) => {
      db.revokedTokenIds = [...new Set([...db.revokedTokenIds, ...Object.keys(db.issuedTokens)])];
    }),
  disable: (email) => findAndUpdate(email, (u) => (u.status = "inactive")),
  setRole: (email, role) => findAndUpdate(email, (u) => (u.role = role)),
};

declare global {
  interface Window {
    __myhcmusMock?: MockDevTools;
  }
}

/** Exposes `window.__myhcmusMock` (mock mode only; installed by MockProvider). */
export function installMockDevTools(): void {
  if (typeof window !== "undefined") {
    window.__myhcmusMock = mockDevTools;
  }
}
