import { NavItemIcon } from "@/components/icons/NavIcons";

/** A summary without a contract endpoint: never shows invented numbers (UC-32 A2, FR-025). */
export function UnavailableSection({
  id,
  title,
  description,
}: {
  id?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-36 flex-col justify-between gap-4 rounded-2xl border border-divider bg-surface p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-heading">{title}</h3>
          {description ? <p className="mt-1 text-xs leading-relaxed text-text-muted">{description}</p> : null}
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-text-muted">
          <NavItemIcon id={id ?? "dashboard"} className="size-4" />
        </span>
      </div>
      <div className="flex items-center gap-1.5 border-t border-divider pt-3">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-border-strong" />
        <p className="text-xs font-medium text-text-muted">Not yet available</p>
      </div>
    </div>
  );
}
