"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon, LogoutIcon } from "@/components/icons/NavIcons";
import { cn } from "@/libs/cn";
import { ROLE_LABEL, type RoleCode } from "@/libs/roles";

export interface AccountMenuUser {
  fullName: string;
  email: string;
  role: RoleCode;
}

type AccountMenuProps = {
  user: AccountMenuUser;
  onLogout: () => void;
  pending?: boolean;
};

/** Menu-button with the account name, role label and "Log out" (UC-02 step 1, A1). */
export function AccountMenu({ user, onLogout, pending = false }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    itemRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const initials = user.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 items-center gap-2.5 rounded-pill px-2 py-1 text-left transition-colors hover:bg-surface-muted"
      >
        <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary shadow-xs">
          {initials}
        </span>
        <span className="hidden flex-col sm:flex">
          <span className="text-[15px] font-semibold leading-tight text-heading">{user.fullName}</span>
          <span className="text-[13px] text-text-muted">{ROLE_LABEL[user.role]}</span>
        </span>
        <ChevronDownIcon className={cn("hidden size-4 text-text-muted transition-transform sm:block", open && "rotate-180")} />
        <span className="sr-only">Account menu</span>
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-divider bg-surface p-2.5 shadow-card"
        >
          <div className="flex items-start gap-3 px-3 py-2.5">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-heading">{user.fullName}</p>
              <p className="truncate text-[13px] text-text-muted">{user.email}</p>
              <span className="mt-1.5 inline-flex rounded-pill bg-info-surface px-2.5 py-0.5 text-xs font-semibold text-primary">
                {ROLE_LABEL[user.role]}
              </span>
            </div>
          </div>
          <div className="mt-1 border-t border-divider pt-1.5">
            <button
              ref={itemRef}
              type="button"
              role="menuitem"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[15px] font-semibold text-danger transition-colors hover:bg-danger-surface disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogoutIcon className="size-4 shrink-0" />
              <span>{pending ? "Logging out…" : "Log out"}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
