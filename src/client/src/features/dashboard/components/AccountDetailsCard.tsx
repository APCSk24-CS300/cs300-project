import { ROLE_LABEL } from "@/libs/roles";
import type { DashboardUser } from "@/features/dashboard/types";

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
      className="rounded-2xl border border-divider bg-surface p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-divider pb-4">
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
            <p className="text-xs text-text-muted">Signed in as {user.fullName}</p>
          </div>
        </div>
      </div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([term, value]) => (
          <div key={term} className="rounded-xl bg-surface-muted/60 px-3.5 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{term}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-heading">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
