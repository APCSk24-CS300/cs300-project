import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";
import { NavItemIcon } from "@/components/icons/NavIcons";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";
import type { NavItem } from "@/libs/navigation";

/** Shortcuts derived from the role navigation (FR-024a): unbuilt ones are not actionable. */
export function ShortcutGrid({ items }: { items: NavItem[] }) {
  return (
    <section aria-labelledby="shortcuts-heading">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="shortcuts-heading" className="text-base font-semibold text-heading">
          Shortcuts
        </h2>
        <span className="text-xs text-text-muted">Quick access to your workspace modules</span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            {item.status === "available" ? (
              <Link
                href={item.href}
                className="group flex min-h-20 items-center justify-between gap-3 rounded-2xl border border-divider bg-surface px-4 py-3.5 text-sm font-semibold text-heading shadow-xs transition-all hover:border-primary/50 hover:bg-info-surface/40 hover:text-primary"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-info-surface text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                    <NavItemIcon id={item.id} className="size-4" />
                  </span>
                  <span>{item.label}</span>
                </span>
                <ArrowRightIcon className="size-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ) : (
              <div
                aria-disabled="true"
                className="flex min-h-20 items-center justify-between gap-3 rounded-2xl border border-divider/80 bg-surface-muted/50 px-4 py-3.5 text-sm text-text-muted"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-text-muted/70">
                    <NavItemIcon id={item.id} className="size-4" />
                  </span>
                  <span className="truncate font-medium">{item.label}</span>
                </span>
                <ComingSoonBadge className="shrink-0 bg-surface text-[10px]" />
                <span className="sr-only">(unavailable)</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
