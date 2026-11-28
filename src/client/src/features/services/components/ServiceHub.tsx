"use client";

import { ForbiddenView } from "@/components/layout/ForbiddenView";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { HUB_CONTENT } from "@/features/services/config/content";
import { ServiceGrid } from "@/features/services/components/ServiceGrid";
import { ServiceGridSkeleton } from "@/features/services/components/ServiceGridSkeleton";
import { useHubServices } from "@/features/services/hooks/useHubServices";
import type { HubService } from "@/features/services/services/hub.service";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPath } from "@/libs/navigation";

type ServiceHubProps = {
  /** Tests may pass a fake; otherwise the API client is used (MSW answers in mock mode). */
  service?: HubService;
};

/** The University Services Hub (UC-07): loading, list, empty (A1), retryable error (A4) and forbidden states. */
export function ServiceHub({ service }: ServiceHubProps) {
  const state = useHubServices(service);
  const { user } = useAuth();

  if (state.status === "loading") return <ServiceGridSkeleton />;

  if (state.status === "forbidden") return <ForbiddenView dashboardHref={getDashboardPath(user?.role)} />;

  if (state.status === "error") {
    return (
      <ErrorState
        title={HUB_CONTENT.errorTitle}
        description={HUB_CONTENT.errorDescription}
        retryLabel={HUB_CONTENT.retryLabel}
        onRetry={state.refetch}
      />
    );
  }

  if (state.status === "empty") {
    return <EmptyState title={HUB_CONTENT.emptyTitle} description={HUB_CONTENT.emptyDescription} />;
  }

  return <ServiceGrid services={state.services ?? []} showDescription />;
}
