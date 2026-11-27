"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ApiError,
  isApiError,
  setAccountDisabledHandler,
  setPasswordChangeRequiredHandler,
  setTokenProvider,
  setUnauthorizedHandler,
} from "@/libs/api-client";
import { clearHint, writeHint } from "@/libs/session-hint";
import { clearToken, getToken, getTokenExp, setToken, subscribeToken } from "@/libs/token-store";
import { CHANGE_PASSWORD_PATH } from "@/libs/route-access";
import { AuthContext, type AuthContextValue, type LogoutOutcome } from "@/features/auth/context/AuthContext";
import { InvalidRoleError, toCurrentUser } from "@/features/auth/mappers/current-user.mapper";
import { authService } from "@/features/auth/services/auth.service";
import type {
  AuthStatus,
  ChangePasswordInput,
  CurrentUser,
  SignOutReason,
} from "@/features/auth/types/auth";
import type { CurrentUserContextWithGaps } from "@/features/auth/types/auth.dto";

/**
 * Turns `/auth/me` data into a CurrentUser, used after login AND on bootstrap (analysis H6).
 * Inactive → ACCOUNT_DISABLED (UC-01 A3, FR-018a); invalid/null role → ROLE_MISSING (A6, FR-007).
 */
function applyContext(data: CurrentUserContextWithGaps["data"]): CurrentUser {
  if (data.user?.status === "inactive") {
    throw new ApiError({ status: 403, code: "ACCOUNT_DISABLED" });
  }
  try {
    return toCurrentUser(data);
  } catch (error) {
    if (error instanceof InvalidRoleError) {
      throw new ApiError({ status: 403, code: "ROLE_MISSING" });
    }
    throw error;
  }
}

function isServerOrNetworkError(error: unknown): boolean {
  return (
    !isApiError(error) ||
    error.code === "NETWORK_ERROR" ||
    error.code === "UNKNOWN" ||
    error.code === "SERVICE_UNAVAILABLE" ||
    error.status >= 500
  );
}

// Registered at module load so the bootstrap request (first effect) already carries the token.
setTokenProvider(getToken);

function reasonHref(reason: SignOutReason, returnTo: string | null): string {
  const params = new URLSearchParams({ reason });
  if (reason === "expired" && returnTo) {
    params.set("redirectTo", returnTo);
  }
  return `/login?${params.toString()}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("unknown");
  const [bootstrapError, setBootstrapError] = useState<ApiError | null>(null);
  const [signOutReason, setSignOutReason] = useState<SignOutReason | null>(null);
  const [bootstrapRun, setBootstrapRun] = useState(0);
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current =
      typeof window === "undefined" ? pathname : `${pathname}${window.location.search}`;
  }, [pathname]);

  const accept = useCallback((current: CurrentUser) => {
    const exp = getTokenExp();
    if (exp !== null) {
      writeHint({ role: current.role, mustChangePassword: current.mustChangePassword, exp });
    }
    setUser(current);
    setBootstrapError(null);
    setSignOutReason(null);
    setStatus(current.mustChangePassword ? "mustChangePassword" : "signedIn");
    return current;
  }, []);

  /** Every transition to signedOut goes through here: token AND hint are cleared (FR-018c). */
  const signOutLocally = useCallback(
    (reason: SignOutReason | null = null) => {
      clearToken();
      clearHint();
      setUser(null);
      setBootstrapError(null);
      setStatus("signedOut");
      setSignOutReason(reason);
      if (reason) {
        // The provider is the only place that redirects for a reason (analysis M12).
        router.replace(reasonHref(reason, pathRef.current));
      }
    },
    [router],
  );

  // Bootstrap: restore the session from the stored token.
  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      await Promise.resolve(); // state updates happen asynchronously, not in the effect body
      if (cancelled) return;
      if (!getToken()) {
        signOutLocally(null); // also clears a stale hint (FR-018c)
        return;
      }
      setStatus("loadingContext");
      try {
        const data = await authService.getCurrentUserContext();
        if (!cancelled) accept(applyContext(data));
      } catch (error) {
        if (cancelled) return;
        if (isApiError(error) && error.code === "ACCOUNT_DISABLED") {
          signOutLocally("disabled");
        } else if (isApiError(error) && error.code === "ROLE_MISSING") {
          signOutLocally("role-missing");
        } else if (isApiError(error) && error.status === 401) {
          signOutLocally(null);
        } else {
          setBootstrapError(isApiError(error) ? error : new ApiError({ status: 0, code: "UNKNOWN" }));
          setStatus("unknown");
        }
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [accept, signOutLocally, bootstrapRun]);

  // Wire the API client and other tabs.
  useEffect(() => {
    setTokenProvider(getToken);
    setUnauthorizedHandler(() => signOutLocally("expired"));
    setAccountDisabledHandler(() => signOutLocally("disabled"));
    setPasswordChangeRequiredHandler(() => {
      setStatus("mustChangePassword");
      router.replace(CHANGE_PASSWORD_PATH);
    });
    const unsubscribe = subscribeToken((value) => {
      if (value === null) {
        signOutLocally("signed-out");
      }
    });
    return () => {
      unsubscribe();
      setUnauthorizedHandler(null);
      setAccountDisabledHandler(null);
      setPasswordChangeRequiredHandler(null);
    };
  }, [router, signOutLocally]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token } = await authService.login({ email: email.trim(), password });
      setToken(token);
      try {
        return accept(applyContext(await authService.getCurrentUserContext()));
      } catch (error) {
        signOutLocally(null);
        if (isApiError(error) && (error.code === "ACCOUNT_DISABLED" || error.code === "ROLE_MISSING")) {
          throw error;
        }
        if (isApiError(error) && error.code === "FORBIDDEN") {
          throw new ApiError({ status: 403, code: "ROLE_MISSING" });
        }
        if (isServerOrNetworkError(error)) {
          // FR-007a: context failure right after login.
          throw new ApiError({ status: 503, code: "SERVICE_UNAVAILABLE" });
        }
        throw error;
      }
    },
    [accept, signOutLocally],
  );

  const logout = useCallback(async (): Promise<LogoutOutcome> => {
    let outcome: LogoutOutcome = "confirmed";
    try {
      await authService.logout();
    } catch (error) {
      outcome = isApiError(error) && error.status === 401 ? "already-expired" : "unconfirmed";
    } finally {
      signOutLocally(outcome === "unconfirmed" ? "logout-unconfirmed" : "signed-out");
    }
    return outcome;
  }, [signOutLocally]);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      signOutLocally(null);
      return null;
    }
    return accept(applyContext(await authService.getCurrentUserContext()));
  }, [accept, signOutLocally]);

  const changePassword = useCallback(
    async (input: ChangePasswordInput) => {
      await authService.changePassword(input);
      const updated = await refresh();
      if (!updated) {
        throw new ApiError({ status: 401, code: "UNAUTHENTICATED" });
      }
      return updated;
    },
    [refresh],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "signedIn" || status === "mustChangePassword",
      isLoading: (status === "unknown" && bootstrapError === null) || status === "loadingContext",
      bootstrapError,
      signOutReason,
      login,
      logout,
      refresh,
      refreshUser: async () => {
        await refresh();
      },
      retryBootstrap: () => setBootstrapRun((n) => n + 1),
      changePassword,
      signOutLocally,
    }),
    [user, status, bootstrapError, signOutReason, login, logout, refresh, changePassword, signOutLocally],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
