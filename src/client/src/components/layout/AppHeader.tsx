"use client";

import { Logo } from "@/components/layout/Logo";
import { AccountMenu, type AccountMenuUser } from "@/components/layout/AccountMenu";
import { MenuIcon } from "@/components/icons/MenuIcon";

type AppHeaderProps = {
  user: AccountMenuUser;
  homeHref: string;
  onLogout: () => void;
  logoutPending?: boolean;
  /** Shown when the mock data source is active (edge case "Demo data"). */
  demoMode?: boolean;
  /** Mobile nav toggle; omitted when there is no navigation (Set a new password). */
  nav?: { open: boolean; controlsId: string; onToggle: () => void };
};

export function AppHeader({ user, homeHref, onLogout, logoutPending, demoMode = false, nav }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/60 bg-surface/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2">
        {nav ? (
          <button
            type="button"
            onClick={nav.onToggle}
            aria-expanded={nav.open}
            aria-controls={nav.controlsId}
            aria-label={nav.open ? "Close navigation" : "Open navigation"}
            className="flex size-11 items-center justify-center rounded-pill text-heading hover:bg-hover-tint lg:hidden"
          >
            <MenuIcon className="size-6" />
          </button>
        ) : null}
        <Logo href={homeHref} />
        {demoMode ? (
          <span className="ml-2 rounded-pill bg-accent-gold/15 px-2.5 py-0.5 text-xs font-semibold text-accent-gold-strong">
            Demo data
          </span>
        ) : null}
      </div>
      <AccountMenu user={user} onLogout={onLogout} pending={logoutPending} />
    </header>
  );
}
