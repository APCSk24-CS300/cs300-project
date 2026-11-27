import Link from "next/link";
import { cn } from "@/libs/cn";
import type { NavItem } from "@/libs/navigation";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";

type SideNavProps = {
  items: NavItem[];
  currentPath: string;
  onNavigate?: () => void;
};

function isCurrent(item: NavItem, currentPath: string): boolean {
  return currentPath === item.href || currentPath.startsWith(`${item.href}/`);
}

/**
 * Role navigation (FR-024). Available items are links; coming-soon items are not links,
 * are not focusable, and are announced as unavailable.
 */
export function SideNav({ items, currentPath, onNavigate }: SideNavProps) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        if (item.status === "coming-soon") {
          return (
            <li key={item.id}>
              <span
                aria-disabled="true"
                className="flex min-h-11 cursor-not-allowed items-center justify-between gap-2 rounded-xl px-3 text-sm text-text-muted"
              >
                <span>{item.label}</span>
                <ComingSoonBadge />
                <span className="sr-only">(unavailable)</span>
              </span>
            </li>
          );
        }
        const current = isCurrent(item, currentPath);
        return (
          <li key={item.id}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold transition-colors",
                current ? "bg-primary text-on-primary" : "text-heading hover:bg-hover-tint",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
