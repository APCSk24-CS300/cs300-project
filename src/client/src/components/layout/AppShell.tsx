"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { cn } from "@/libs/cn";
import type { NavItem } from "@/libs/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import type { AccountMenuUser } from "@/components/layout/AccountMenu";
import { SideNav } from "@/components/layout/SideNav";

type AppShellProps = {
  user: AccountMenuUser;
  homeHref: string;
  navItems: NavItem[];
  currentPath: string;
  onLogout: () => void;
  logoutPending?: boolean;
  demoMode?: boolean;
  children: ReactNode;
};

/**
 * The one authenticated shell for every role (FR-023): skip link, header with account menu,
 * role navigation (persistent at lg, drawer below), and the main content area.
 */
export function AppShell({
  user,
  homeHref,
  navItems,
  currentPath,
  onLogout,
  logoutPending,
  demoMode,
  children,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navId = useId();
  const hasNav = navItems.length > 0;

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-page">
      <a
        href="#main"
        className="sr-only z-50 rounded-pill bg-surface px-4 py-2 font-semibold text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <AppHeader
        user={user}
        homeHref={homeHref}
        onLogout={onLogout}
        logoutPending={logoutPending}
        demoMode={demoMode}
        nav={hasNav ? { open: drawerOpen, controlsId: navId, onToggle: () => setDrawerOpen((v) => !v) } : undefined}
      />
      <div className="mx-auto flex w-full max-w-[var(--container-landing)] gap-6 px-4 py-6 sm:px-6">
        {hasNav ? (
          <>
            {drawerOpen ? (
              <button
                type="button"
                aria-label="Close navigation"
                tabIndex={-1}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 z-30 bg-black/30 lg:hidden"
              />
            ) : null}
            <nav
              id={navId}
              aria-label="Main"
              className={cn(
                "w-64 shrink-0 rounded-card bg-surface p-3 shadow-card",
                "lg:sticky lg:top-22 lg:block lg:self-start",
                drawerOpen ? "fixed inset-y-0 left-0 z-40 block overflow-y-auto rounded-none" : "hidden",
              )}
            >
              <SideNav items={navItems} currentPath={currentPath} onNavigate={() => setDrawerOpen(false)} />
            </nav>
          </>
        ) : null}
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
