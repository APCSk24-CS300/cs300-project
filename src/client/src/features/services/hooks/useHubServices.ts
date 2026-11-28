"use client";

import { useAsyncResource } from "@/hooks/useAsyncResource";
import { hubService, type HubService } from "@/features/services/services/hub.service";
import type { UniversityService } from "@/features/services/types/service";

export type HubServicesStatus = "loading" | "success" | "empty" | "error" | "forbidden";

export interface HubServicesState {
  status: HubServicesStatus;
  /** Active services in hub order; null unless `success` or `empty`. */
  services: UniversityService[] | null;
  error: unknown;
  refetch: () => void;
}

/**
 * Active university services (UC-07) on the shared `useAsyncResource` core: loading / success /
 * empty (A1) / error (A4) / forbidden (wiring rule: `isForbiddenError`, no `useForbidden` here).
 * Late answers after unmount or a newer request are ignored. `enabled=false` skips loading
 * (guests on the landing page).
 */
export function useHubServices(service: HubService = hubService, enabled = true): HubServicesState {
  const resource = useAsyncResource(() => service.listServices(), ["hub-services"], enabled);
  const services = resource.data;
  const status: HubServicesStatus =
    resource.status === "success" && services !== null && services.length === 0 ? "empty" : resource.status;
  return { status, services, error: resource.error, refetch: resource.retry };
}
