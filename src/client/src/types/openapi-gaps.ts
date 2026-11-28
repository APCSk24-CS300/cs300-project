/**
 * Wire shapes that are NOT (yet) in docs/api/openapi.yaml v1.2.0.
 *
 * Each export is tagged with its gap ID from
 * specs/003-auth-dashboard-admin-users/spec.md ("API Gaps") and its proposal in
 * specs/003-auth-dashboard-admin-users/docs-changes.md. They are served only by the
 * MSW mock until the backend accepts them. Remove each one once the contract covers it.
 */
import type { components } from "@/types/openapi.gen";

type Schemas = components["schemas"];

export type UserRole = Schemas["UserRole"];
export type Profile = Schemas["Profile"];
export type ErrorResponse = Schemas["ErrorResponse"];
export type ApiMessage = Schemas["ApiMessage"];
export type CreateUserRequest = Schemas["CreateUserRequest"];

/** API-GAP-002 / GAP-A: login request (no role selector; the role comes from the account). */
export interface LoginRequest {
  email: string;
  password: string;
}

/** API-GAP-002 refinement / GAP-D / DOC-03: the bearer token is returned in the body, as in src/server. */
export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    /** ISO date-time at which the token expires (1 hour, as in src/server). */
    expiresAt: string;
  };
}

/** GAP-B / GAP-M / GAP-N (DOC-01, DOC-04, DOC-06): error codes not in ErrorResponse's documented list. */
export type GapErrorCode =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_DISABLED"
  | "ACCOUNT_LOCKED"
  | "ROLE_MISSING"
  | "PASSWORD_CHANGE_REQUIRED"
  | "SERVICE_UNAVAILABLE";

/** GAP-C / DOC-05: the temporary password chosen on the review step. */
export type CreateUserRequestWithPassword = CreateUserRequest & {
  initialPassword: string;
};

/** GAP-M (DOC-06) and GAP-O (DOC-02): password-change mark and nullable role. */
export type ProfileWithGaps = Omit<Profile, "role"> & {
  role: UserRole | null;
  mustChangePassword?: boolean;
};

type CurrentUserContextData = NonNullable<
  Schemas["CurrentUserContextResponse"]["data"]
>;

/** `GET /auth/me` response with the gap fields above. */
export interface CurrentUserContextWithGaps {
  success: boolean;
  data: Omit<CurrentUserContextData, "user"> & { user: ProfileWithGaps };
}
