import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LockIcon } from "@/components/icons/LockIcon";

/** Shared no-permission presentation (FR-020, FR-021). */
export function ForbiddenView({ dashboardHref }: { dashboardHref: string }) {
  return (
    <EmptyState
      icon={<LockIcon className="size-10" />}
      title="You don't have permission to view this page"
      description="This page belongs to another role. Your account can only open its own pages."
      action={<Button href={dashboardHref}>Go to my dashboard</Button>}
    />
  );
}
