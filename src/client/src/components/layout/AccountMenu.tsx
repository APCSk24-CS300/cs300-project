"use client";

import { useEffect, useId, useRef, useState } from "react";
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
        className="flex min-h-11 items-center gap-3 rounded-pill px-2 py-1 text-left hover:bg-hover-tint"
      >
        <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
          {initials}
        </span>
        <span className="hidden flex-col sm:flex">
          <span className="text-sm font-semibold text-heading">{user.fullName}</span>
          <span className="text-xs text-text-muted">{ROLE_LABEL[user.role]}</span>
        </span>
        <span className="sr-only">Account menu</span>
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-border bg-surface p-2 shadow-card"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-heading">{user.fullName}</p>
            <p className="truncate text-xs text-text-muted">{user.email}</p>
            <p className="mt-1 text-xs font-semibold text-primary">{ROLE_LABEL[user.role]}</p>
          </div>
          <button
            ref={itemRef}
            type="button"
            role="menuitem"
            disabled={pending}
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-danger-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Logging out…" : "Log out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
