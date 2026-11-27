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
    <div className="flex min-h-40 flex-col justify-between gap-4 rounded-2xl border border-divider bg-surface p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-heading">{title}</h3>
          {description ? <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{description}</p> : null}
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-text-muted">
          <NavItemIcon id={id ?? "dashboard"} className="size-4.5" />
        </span>
      </div>
      <div className="flex items-center gap-2 border-t border-divider pt-3">
        <span aria-hidden="true" className="size-2 rounded-full bg-border-strong" />
        <p className="text-[13px] font-medium text-text-muted">Not yet available</p>
      </div>
    </div>
  );
}
