import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { NAVIGATION } from "@/libs/navigation";
import { DASHBOARD_SECTIONS } from "@/features/dashboard/config/dashboard-sections";
import type { DashboardUser } from "@/features/dashboard/types";
import { AccountDetailsCard } from "@/features/dashboard/components/AccountDetailsCard";
import { AdminInsightsSection } from "@/features/dashboard/components/AdminInsightsSection";
import { ShortcutGrid } from "@/features/dashboard/components/ShortcutGrid";
import { UnavailableSection } from "@/features/dashboard/components/UnavailableSection";

/** Role-based university dashboard (UC-32, FR-025): tailored header, live insights, overview, shortcuts. */
export function RoleDashboard({ user }: { user: DashboardUser }) {
  const shortcuts = NAVIGATION[user.role].filter((item) => item.id !== "dashboard");
  const sections = DASHBOARD_SECTIONS[user.role];

  const actions =
    user.role === "administrator" ? (
      <>
        <Button variant="white" size="sm" href="/admin/users">
          Manage users
        </Button>
        <Button size="sm" href="/admin/users/new">
          Create account
        </Button>
      </>
    ) : undefined;

  const overviewSubtitle =
    user.role === "student"
      ? "Activities, registrations, and training-score progress"
      : user.role === "manager"
        ? "Activity operations, registrations, and pending verifications"
        : "Campus-wide activity and training-score metrics";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description={`Welcome, ${user.fullName}`} actions={actions} />
      <AccountDetailsCard user={user} />

      {user.role === "administrator" ? <AdminInsightsSection /> : null}

      <section aria-labelledby="overview-heading">
        <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="overview-heading" className="text-xl font-semibold text-heading">
            Overview
          </h2>
          <span className="text-sm text-text-muted">{overviewSubtitle}</span>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => (
            <UnavailableSection
              key={section.id}
              id={section.id}
              title={section.title}
              description={section.description}
            />
          ))}
        </div>
      </section>

      <ShortcutGrid items={shortcuts} />
    </div>
  );
}
