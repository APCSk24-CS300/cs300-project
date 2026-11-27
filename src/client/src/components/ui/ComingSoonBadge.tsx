import { cn } from "@/libs/cn";

/** Shared "Coming soon" marker for unbuilt destinations (FR-024, FR-024a). */
export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill bg-black/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted",
        className,
      )}
    >
      Coming soon
    </span>
  );
}
