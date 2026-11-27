import { ROLE_LABEL } from "@/libs/roles";
import type { DashboardUser } from "@/features/dashboard/types";

/** Compact identity & academic context strip so the dashboard prioritizes role workflows. */
export function AccountDetailsCard({ user }: { user: DashboardUser }) {
  const rows: [string, string][] = [
    ["Email", user.email],
    ["Role", ROLE_LABEL[user.role]],
  ];
  if (user.role === "student") {
    rows.push(["Student number", user.studentNumber ?? "—"]);
    rows.push(["Faculty", user.faculty?.name ?? "—"]);
  }

  const initials = user.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <section
      aria-labelledby="account-details-heading"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-divider bg-surface px-5 py-3.5 shadow-xs"
    >
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
        >
          {initials}
        </span>
        <div>
          <h2 id="account-details-heading" className="text-base font-semibold text-heading">
            Account details
          </h2>
          <p className="text-[13px] text-text-muted">VNU-HCM University of Science</p>
        </div>
      </div>

      <dl className="flex flex-wrap items-center gap-x-7 gap-y-2.5">
        {rows.map(([term, value]) => (
          <div key={term} className="flex flex-col">
            <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">{term}</dt>
            <dd className="text-[15px] font-medium text-heading">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
