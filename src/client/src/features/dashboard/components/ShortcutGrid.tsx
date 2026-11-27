import Link from "next/link";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";
import type { NavItem } from "@/libs/navigation";

/** Shortcuts derived from the role navigation (FR-024a): unbuilt ones are not actionable. */
export function ShortcutGrid({ items }: { items: NavItem[] }) {
  return (
    <section aria-labelledby="shortcuts-heading">
      <h2 id="shortcuts-heading" className="mb-3 text-base font-semibold text-heading">
        Shortcuts
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            {item.status === "available" ? (
              <Link
                href={item.href}
                className="flex min-h-20 items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-heading shadow-sm transition-colors hover:border-primary hover:text-primary"
              >
                {item.label}
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <div
                aria-disabled="true"
                className="flex min-h-20 items-center justify-between gap-2 rounded-2xl border border-dashed border-border bg-surface px-4 py-3 text-sm text-text-muted"
              >
                <span>{item.label}</span>
                <ComingSoonBadge />
                <span className="sr-only">(unavailable)</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
