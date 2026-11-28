import type { RoleCode } from "@/libs/roles";

export type AccountStatus = "active" | "inactive";

/** Domain user of the current session (data-model §2.1). Exactly one role, never null here. */
export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: RoleCode;
  status: AccountStatus;
  avatarUrl: string | null;
  studentNumber: string | null;
  faculty: { id: string; code: string; name: string } | null;
  /** Used only to show/hide UI; the server enforces (constitution IV). */
  permissions: string[];
  mustChangePassword: boolean;
}

export type AuthStatus = "unknown" | "signedOut" | "loadingContext" | "signedIn" | "mustChangePassword";

/** Why the user was signed out; drives the notice on /login (?reason=). */
export type SignOutReason = "signed-out" | "logout-unconfirmed" | "expired" | "disabled" | "role-missing";

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
