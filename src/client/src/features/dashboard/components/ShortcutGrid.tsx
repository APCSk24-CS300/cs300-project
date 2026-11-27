import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";
import { NavItemIcon } from "@/components/icons/NavIcons";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";
import type { NavItem } from "@/libs/navigation";

/** Shortcuts derived from the role navigation (FR-024a): separates active actions from upcoming modules. */
export function ShortcutGrid({ items }: { items: NavItem[] }) {
  const available = items.filter((item) => item.status === "available");
  const upcoming = items.filter((item) => item.status === "coming-soon");

  return (
    <section aria-labelledby="shortcuts-heading" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="shortcuts-heading" className="text-base font-semibold text-heading">
          Shortcuts
        </h2>
        <span className="text-xs text-text-muted">Role workspace &amp; campus modules</span>
      </div>

      {available.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {available.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex min-h-18 items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-info-surface/40 px-4 py-3.5 text-sm font-semibold text-heading shadow-xs transition-all hover:border-primary hover:bg-info-surface/80 hover:text-primary"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-xs">
                    <NavItemIcon id={item.id} className="size-4" />
                  </span>
                  <span>{item.label}</span>
                </span>
                <ArrowRightIcon className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {upcoming.length > 0 ? (
        <div className="rounded-2xl border border-divider bg-surface p-4 shadow-xs">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Upcoming Platform Modules
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((item) => (
              <li key={item.id}>
                <div
                  aria-disabled="true"
                  className="flex items-center justify-between gap-2 rounded-xl bg-surface-muted/50 px-3 py-2.5 text-sm text-text-muted"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <NavItemIcon id={item.id} className="size-4 shrink-0 text-text-muted/70" />
                    <span className="font-medium text-heading/80">{item.label}</span>
                  </span>
                  <ComingSoonBadge className="shrink-0 bg-transparent px-0 text-[10px] font-medium tracking-normal text-text-muted/80" />
                  <span className="sr-only">(unavailable)</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
