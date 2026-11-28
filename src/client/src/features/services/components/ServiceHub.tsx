"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { HUB_CONTENT } from "@/features/services/config/content";
import { ServiceGrid } from "@/features/services/components/ServiceGrid";
import { ServiceGridSkeleton } from "@/features/services/components/ServiceGridSkeleton";
import { useUniversityServices } from "@/features/services/hooks/useUniversityServices";
import type { HubService } from "@/features/services/services/hub.service";

type ServiceHubProps = {
  /** Tests pass a fake; the page uses the mock or real service from the factory. */
  service?: HubService;
};

/** The University Services Hub (UC-07): loading, list, empty (A1) and retryable error (A4) states. */
export function ServiceHub({ service }: ServiceHubProps) {
  const state = useUniversityServices(service);

  if (state.status === "loading") return <ServiceGridSkeleton />;

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

  return <ServiceGrid services={state.services} showDescription />;
}
