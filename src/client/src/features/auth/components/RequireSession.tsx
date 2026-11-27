"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/hooks/useAuth";
import { toUserMessage } from "@/libs/error-messages";
import { getLoginHref } from "@/libs/navigation";
import { resolveRouteAccess } from "@/libs/route-access";
import { readHint } from "@/libs/session-hint";
import { getToken } from "@/libs/token-store";

/**
 * Client-side guard for every protected page (second layer after src/proxy.ts).
 * Cosmetic only (FR-021). Redirect ownership (analysis M12): when the provider signed the user
 * out with a reason it already navigated to /login?reason=…; this guard only redirects when
 * there is no reason (e.g. no token at bootstrap).
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, bootstrapError, signOutReason, retryBootstrap, signOutLocally } = useAuth();

  const access =
    user && (status === "signedIn" || status === "mustChangePassword")
      ? resolveRouteAccess(
          pathname,
          // Client state is authoritative here; expiry is handled by the token store / 401s.
          { role: user.role, mustChangePassword: status === "mustChangePassword", exp: Number.MAX_SAFE_INTEGER },
          0,
        )
      : null;

  useEffect(() => {
    if (status === "signedOut" && signOutReason === null) {
      const search = typeof window === "undefined" ? "" : window.location.search;
      router.replace(getLoginHref(`${pathname}${search}`));
    }
  }, [status, signOutReason, pathname, router]);

  useEffect(() => {
    if (access?.type === "redirect") {
      router.replace(access.to);
    }
  }, [access?.type, access?.type === "redirect" ? access.to : null, router]); // eslint-disable-line react-hooks/exhaustive-deps

  // UC-02 A4 / FR-018c: a page restored from the back-forward cache re-checks the session.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && (!getToken() || !readHint())) {
        signOutLocally(null);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [signOutLocally]);

  if (bootstrapError) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <ErrorState
          title="We couldn't restore your session"
          description={toUserMessage(bootstrapError, "load")}
          onRetry={retryBootstrap}
        />
      </main>
    );
  }

  if (!user || access === null || access.type === "redirect") {
    return <LoadingState variant="page" label="Checking your session…" />;
  }

  return <>{children}</>;
}
