import { SurfaceCard } from "@/components/ui/SurfaceCard";
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

  return (
    <SurfaceCard className="p-5">
      <h2 className="text-base font-semibold text-heading">Account details</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {rows.map(([term, value]) => (
          <div key={term}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">{term}</dt>
            <dd className="mt-0.5 break-words text-sm text-heading">{value}</dd>
          </div>
        ))}
      </dl>
    </SurfaceCard>
  );
}
