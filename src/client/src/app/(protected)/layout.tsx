"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { NAVIGATION, getDashboardPath } from "@/libs/navigation";
import { useIsMockMode } from "@/mocks/MockProvider";
import { RequireSession } from "@/features/auth/components/RequireSession";

function ProtectedShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, status, logout } = useAuth();
  const demoMode = useIsMockMode();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <AppShell
      user={user}
      homeHref={getDashboardPath(user.role)}
      // FR-044: while a password change is pending, only the header and account menu show.
      navItems={status === "mustChangePassword" ? [] : NAVIGATION[user.role]}
      currentPath={pathname}
      demoMode={demoMode}
      logoutPending={loggingOut}
      onLogout={async () => {
        setLoggingOut(true);
        try {
          await logout(); // the provider navigates to /login?reason=…
        } finally {
          setLoggingOut(false);
        }
      }}
    >
      {children}
    </AppShell>
  );
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSession>
      <ProtectedShell>{children}</ProtectedShell>
    </RequireSession>
  );
}
