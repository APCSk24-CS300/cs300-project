import { HttpResponse, type DefaultBodyType, type HttpResponseResolver, type PathParams } from "msw";
import type { RoleCode } from "@/libs/roles";
import { readDb } from "@/mocks/db/store";
import type { MockDb, MockUser, OperationName } from "@/mocks/db/types";
import { fail } from "@/mocks/utils/envelope";
import { bearerFrom, verifyToken, type MockClaims } from "@/mocks/utils/token";

export interface AuthContext {
  user: MockUser;
  claims: MockClaims;
  db: MockDb;
}

interface WithAuthOptions {
  requireRole?: RoleCode;
  /** Allow the call while `mustChangePassword` is true (/auth/me, /profile/password, /auth/logout). */
  allowWhenMustChange?: boolean;
  /** `GET /auth/me`: no status/role/password checks; the client applies A3/A6 itself (H2). */
  skipAccountChecks?: boolean;
  /** `POST /auth/logout`: skip checks 1-3 so disabled or role-less users can still sign out. */
  skipStatusAndRoleChecks?: boolean;
}

type Info = Parameters<HttpResponseResolver<PathParams, DefaultBodyType>>[0];

/**
 * Authenticated-request rules (contracts/mock-api.md). Order:
 * token → 1 inactive (ACCOUNT_DISABLED) → 2 role null (FORBIDDEN) →
 * 3 mustChangePassword (PASSWORD_CHANGE_REQUIRED) → 4 role mismatch (FORBIDDEN).
 */
export function withAuth(
  resolver: (info: Info, ctx: AuthContext) => ReturnType<HttpResponseResolver> | Promise<Response>,
  options: WithAuthOptions = {},
): HttpResponseResolver {
  return async (info) => {
    const claims = verifyToken(bearerFrom(info.request));
    if (!claims) {
      return fail(401, "UNAUTHENTICATED", "Authentication is required or the access token is invalid.");
    }
    const db = readDb();
    const user = db.users.find((u) => u.id === claims.sub);
    if (!user) {
      return fail(401, "UNAUTHENTICATED", "Authentication is required or the access token is invalid.");
    }

    if (!options.skipAccountChecks) {
      if (!options.skipStatusAndRoleChecks) {
        if (user.status === "inactive") {
          return fail(403, "ACCOUNT_DISABLED", "This account is disabled.");
        }
        if (user.role === null) {
          return fail(403, "FORBIDDEN", "This account has no role.");
        }
        if (user.mustChangePassword && !options.allowWhenMustChange) {
          return fail(403, "PASSWORD_CHANGE_REQUIRED", "Set a new password first.");
        }
      }
      if (options.requireRole && user.role !== options.requireRole) {
        return fail(403, "FORBIDDEN", "You do not have permission to perform this operation.");
      }
    }

    return resolver(info, { user, claims, db });
  };
}

/** Failure switch (dev/test): forces 500 (or a network error with `:network`) without touching the store. */
export function withFailureSwitch(op: OperationName, resolver: HttpResponseResolver): HttpResponseResolver {
  return async (info) => {
    const failures = readDb().failures;
    if (failures.includes(`${op}:network`)) {
      return HttpResponse.error();
    }
    if (failures.includes(op)) {
      return fail(500, "UNKNOWN", "Simulated server error.");
    }
    return resolver(info);
  };
}
