"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import { AuthContext } from "@/features/auth/context/AuthContext";
import { NAVIGATION_ITEMS } from "@/libs/navigation";
import { cn } from "@/libs/cn";

/** Navigation for the signed-in role (NAVIGATION_ITEMS). Renders nothing for guests. */
export function RoleNav() {
  const auth = useContext(AuthContext);
  const pathname = usePathname();
  const role = auth?.user?.role;
  if (!role) return null;

  return (
    <nav aria-label="Main" className="border-b border-slate-200 bg-surface">
      <ul className="mx-auto flex w-full max-w-landing flex-wrap gap-1 px-[var(--page-gutter)] py-2">
        {NAVIGATION_ITEMS[role].map((item) => {
          const current = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-text hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-focus-ring",
                  current && "bg-primary/10 text-primary",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
