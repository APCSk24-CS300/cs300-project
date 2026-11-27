import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { NAVIGATION } from "@/libs/navigation";
import { DASHBOARD_SECTIONS } from "@/features/dashboard/config/dashboard-sections";
import type { DashboardUser } from "@/features/dashboard/types";
import { AccountDetailsCard } from "@/features/dashboard/components/AccountDetailsCard";
import { ShortcutGrid } from "@/features/dashboard/components/ShortcutGrid";
import { UnavailableSection } from "@/features/dashboard/components/UnavailableSection";

/** Draft role dashboard (UC-32, FR-025): greeting, account details, shortcuts, summaries. */
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description={`Welcome, ${user.fullName}`} actions={actions} />
      <AccountDetailsCard user={user} />
      <section aria-labelledby="overview-heading">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 id="overview-heading" className="text-base font-semibold text-heading">
            Overview
          </h2>
          <span className="text-xs text-text-muted">Role summary metrics</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
