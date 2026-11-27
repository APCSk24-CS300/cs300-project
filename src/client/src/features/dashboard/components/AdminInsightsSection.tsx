"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";
import { NavItemIcon } from "@/components/icons/NavIcons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROLE_LABEL } from "@/libs/roles";
import { useAdminDashboardData } from "@/features/dashboard/hooks/useAdminDashboardData";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Live University Administration KPIs, Role Distribution, and Recent Accounts
 * powered by existing admin-users endpoints.
 */
export function AdminInsightsSection() {
  const { status, data, retry } = useAdminDashboardData(true);

  if (status === "error") {
    return (
      <section aria-labelledby="admin-insights-heading" className="rounded-2xl border border-divider bg-surface p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="admin-insights-heading" className="text-base font-semibold text-heading">
              Directory &amp; Account Insights
            </h2>
            <p className="mt-0.5 text-sm text-text-muted">
              Live account metrics could not be loaded right now.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="border border-divider" onClick={retry}>
            Retry
          </Button>
        </div>
      </section>
    );
  }

  const loading = status === "loading" || !data;

  const kpis = [
    {
      id: "users",
      label: "Total Accounts",
      value: data?.totalUsers,
      hint: "Registered campus accounts",
      tone: "bg-info-surface text-primary",
    },
    {
      id: "profile",
      label: "Students",
      value: data?.studentCount,
      hint: "Undergraduate & student accounts",
      tone: "bg-primary/10 text-primary",
    },
    {
      id: "activities",
      label: "Activity Managers",
      value: data?.managerCount,
      hint: "Clubs, departments & organizers",
      tone: "bg-accent-gold/15 text-accent-gold-strong",
    },
    {
      id: "services",
      label: "Faculties",
      value: data?.facultiesCount,
      hint: "Academic units configured",
      tone: "bg-success/10 text-success",
    },
  ];

  const roleTotal = data ? data.studentCount + data.managerCount + data.adminCount : 0;
  const studentPct = data ? pct(data.studentCount, roleTotal) : 0;
  const managerPct = data ? pct(data.managerCount, roleTotal) : 0;
  const adminPct = data ? Math.max(0, 100 - studentPct - managerPct) : 0;

  return (
    <section aria-labelledby="admin-insights-heading" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="admin-insights-heading" className="text-base font-semibold text-heading">
            Directory &amp; Account Insights
          </h2>
          <p className="text-xs text-text-muted">Live snapshot of campus accounts and academic units</p>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          <span>Open User Directory</span>
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="flex flex-col justify-between gap-3 rounded-2xl border border-divider bg-surface p-4 shadow-xs"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{kpi.label}</span>
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${kpi.tone}`}>
                <NavItemIcon id={kpi.id} className="size-4" />
              </span>
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold tracking-tight text-heading tabular-nums">{kpi.value}</p>
              )}
              <p className="mt-1 text-xs text-text-muted">{kpi.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics + Recent Accounts */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Recent Accounts (7 cols) */}
        <div className="flex flex-col rounded-2xl border border-divider bg-surface shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between gap-3 border-b border-divider px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-heading">Recently Created Accounts</h3>
              <p className="text-xs text-text-muted">Latest accounts added to myHCMUS</p>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3 p-5">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data.recentUsers.length === 0 ? (
            <div className="p-6 text-center text-sm text-text-muted">No accounts created yet.</div>
          ) : (
            <div className="divide-y divide-divider">
              {data.recentUsers.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-heading">{account.fullName}</p>
                    <p className="truncate text-xs text-text-muted">{account.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-pill bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-heading">
                      {account.role ? ROLE_LABEL[account.role] : "Unassigned"}
                    </span>
                    <Badge tone={account.status === "active" ? "success" : "neutral"} withDot>
                      {account.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                    <span className="hidden text-xs text-text-muted tabular-nums sm:inline">
                      {dateFormat.format(account.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role Distribution (5 cols) */}
        <div className="flex flex-col justify-between gap-5 rounded-2xl border border-divider bg-surface p-5 shadow-xs lg:col-span-5">
          <div>
            <h3 className="text-sm font-semibold text-heading">User Distribution by Role</h3>
            <p className="mt-0.5 text-xs text-text-muted">Proportion of assigned roles across active directory</p>

            {loading ? (
              <div className="mt-5 flex flex-col gap-3">
                <Skeleton className="h-3 w-full rounded-pill" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <>
                <div
                  aria-label="User role distribution bar"
                  className="mt-5 flex h-3 w-full overflow-hidden rounded-pill bg-surface-muted"
                >
                  {studentPct > 0 ? (
                    <div
                      style={{ width: `${studentPct}%` }}
                      className="bg-primary transition-all"
                      title={`Students: ${data.studentCount}`}
                    />
                  ) : null}
                  {managerPct > 0 ? (
                    <div
                      style={{ width: `${managerPct}%` }}
                      className="bg-accent-gold transition-all"
                      title={`Managers: ${data.managerCount}`}
                    />
                  ) : null}
                  {adminPct > 0 ? (
                    <div
                      style={{ width: `${adminPct}%` }}
                      className="bg-heading transition-all"
                      title={`Administrators: ${data.adminCount}`}
                    />
                  ) : null}
                </div>

                <ul className="mt-5 flex flex-col gap-2.5 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-heading">
                      <span aria-hidden="true" className="size-2.5 rounded-full bg-primary" />
                      <span>Students</span>
                    </span>
                    <span className="font-semibold text-heading tabular-nums">
                      {data.studentCount} <span className="text-xs font-normal text-text-muted">({studentPct}%)</span>
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-heading">
                      <span aria-hidden="true" className="size-2.5 rounded-full bg-accent-gold" />
                      <span>Managers</span>
                    </span>
                    <span className="font-semibold text-heading tabular-nums">
                      {data.managerCount} <span className="text-xs font-normal text-text-muted">({managerPct}%)</span>
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-heading">
                      <span aria-hidden="true" className="size-2.5 rounded-full bg-heading" />
                      <span>Administrators</span>
                    </span>
                    <span className="font-semibold text-heading tabular-nums">
                      {data.adminCount} <span className="text-xs font-normal text-text-muted">({adminPct}%)</span>
                    </span>
                  </li>
                </ul>
              </>
            )}
          </div>

          <div className="border-t border-divider pt-4">
            <p className="text-xs font-medium text-text-muted">
              Role permissions and one-role-per-account rules are enforced on account creation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
