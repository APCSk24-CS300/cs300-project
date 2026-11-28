"use client";

import { useCallback, useMemo, useState } from "react";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { adminHubService, type AdminHubService } from "@/features/services/admin/services/admin-hub.service";
import { compareServices } from "@/features/services/mappers/service.mapper";
import type { UniversityService } from "@/features/services/types/service";
import type { CreateServiceLinkDTO, UpdateServiceLinkDTO } from "@/features/services/types/service.dto";

export type AdminLinksStatus = "loading" | "ready" | "error" | "forbidden";

export interface AdminLinksState {
  status: AdminLinksStatus;
  /** Every link (active and inactive) in hub order; null unless `ready`. */
  links: UniversityService[] | null;
  error: unknown;
}

/**
 * Admin list of service links plus the actions on it, on the shared `useAsyncResource` core.
 * Every action sends the version the admin last saw (If-Match) and, on success, replaces that row
 * with the saved link (no reload flicker). Errors are thrown to the caller: the component owns
 * `useForbidden` and the field/412 messages (wiring rule). `reload` drops local changes and refetches.
 */
export function useAdminServiceLinks(service: AdminHubService = adminHubService) {
  const resource = useAsyncResource(() => service.listAll(), ["admin-service-links"]);
  const [saved, setSaved] = useState<Record<string, UniversityService>>({});

  const links = useMemo(() => {
    if (resource.status !== "success" || !resource.data) return null;
    const byId = new Map(resource.data.map((l) => [l.id, l]));
    for (const link of Object.values(saved)) byId.set(link.id, link);
    return [...byId.values()].sort(compareServices);
  }, [resource.status, resource.data, saved]);

  const { retry } = resource;
  const reload = useCallback(() => {
    setSaved({});
    retry();
  }, [retry]);

  const keep = useCallback((link: UniversityService) => {
    setSaved((current) => ({ ...current, [link.id]: link }));
    return link;
  }, []);

  const create = useCallback(async (body: CreateServiceLinkDTO) => keep(await service.create(body)), [service, keep]);
  const update = useCallback(
    async (link: UniversityService, body: UpdateServiceLinkDTO) => keep(await service.update(link.id, body, link.version)),
    [service, keep],
  );
  const deactivate = useCallback(
    async (link: UniversityService) => keep(await service.deactivate(link.id, link.version)),
    [service, keep],
  );
  const reactivate = useCallback(
    async (link: UniversityService) => keep(await service.update(link.id, { isActive: true }, link.version)),
    [service, keep],
  );

  const state: AdminLinksState =
    resource.status === "success"
      ? { status: "ready", links, error: null }
      : { status: resource.status, links: null, error: resource.error };

  return { ...state, reload, create, update, deactivate, reactivate };
}
