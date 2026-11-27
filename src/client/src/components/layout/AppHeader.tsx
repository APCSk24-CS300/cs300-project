"use client";

import { Logo } from "@/components/layout/Logo";
import { AccountMenu, type AccountMenuUser } from "@/components/layout/AccountMenu";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { ROLE_LABEL } from "@/libs/roles";

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
    <header className="sticky top-0 z-30 border-b border-divider bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-17 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {nav ? (
            <button
              type="button"
              onClick={nav.onToggle}
              aria-expanded={nav.open}
              aria-controls={nav.controlsId}
              aria-label={nav.open ? "Close navigation" : "Open navigation"}
              className="flex size-11 items-center justify-center rounded-xl text-heading transition-colors hover:bg-surface-muted lg:hidden"
            >
              <MenuIcon className="size-6" />
            </button>
          ) : null}
          <Logo href={homeHref} />
          <span className="hidden rounded-pill bg-surface-muted px-3 py-1 text-[13px] font-medium text-text-muted md:inline-flex">
            {ROLE_LABEL[user.role]} Portal
          </span>
          {demoMode ? (
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent-gold/30 bg-accent-gold/12 px-2.5 py-0.5 text-xs font-semibold text-accent-gold-strong">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-accent-gold-strong" />
              Demo data
            </span>
          ) : null}
        </div>
        <AccountMenu user={user} onLogout={onLogout} pending={logoutPending} />
      </div>
    </header>
  );
}
