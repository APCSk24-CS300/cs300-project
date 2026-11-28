"use client";

import { createContext } from "react";
import type { ApiError } from "@/libs/api-client";
import type {
  AuthStatus,
  ChangePasswordInput,
  CurrentUser,
  SignOutReason,
} from "@/features/auth/types/auth";

export type LogoutOutcome = "confirmed" | "already-expired" | "unconfirmed";

export interface AuthContextValue {
  user: CurrentUser | null;
  status: AuthStatus;
  /** Signed in (including while a password change is pending). */
  isAuthenticated: boolean;
  /** Session state not known yet (bootstrap or loading the context). */
  isLoading: boolean;
  /** Non-401 failure while restoring a session; the token is kept and can be retried. */
  bootstrapError: ApiError | null;
  /** Set when the provider itself navigates to /login with a reason (it owns that redirect). */
  signOutReason: SignOutReason | null;

  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => Promise<LogoutOutcome>;
  refresh: () => Promise<CurrentUser | null>;
  /** Kept for existing consumers; same as `refresh`. */
  refreshUser: () => Promise<void>;
  retryBootstrap: () => void;
  changePassword: (input: ChangePasswordInput) => Promise<CurrentUser>;
  /** Clears token + hint and signs out (FR-018c). With a reason, also navigates to /login?reason=. */
  signOutLocally: (reason?: SignOutReason | null) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
