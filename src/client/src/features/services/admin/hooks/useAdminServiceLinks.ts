"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createAdminHubService } from "@/features/services/admin/services/admin-hub.service.factory";
import type { AdminHubService } from "@/features/services/admin/services/admin-hub.service";
import { compareServices } from "@/features/services/mappers/service.mapper";
import type { UniversityService } from "@/features/services/types/service";
import type { CreateServiceLinkDTO, UpdateServiceLinkDTO } from "@/features/services/types/service.dto";

export type AdminLinksState =
  | { status: "loading"; links: null; error: null }
  | { status: "ready"; links: UniversityService[]; error: null }
  | { status: "error"; links: null; error: Error };

/**
 * Admin list of service links plus the actions on it. Every action sends the version the admin last saw
 * (If-Match) and, on success, replaces that row with the saved link. Errors are thrown to the caller so
 * the form can show field errors (400/409) or the reload message (412).
 */
export function useAdminServiceLinks(injected?: AdminHubService) {
  const fallback = useMemo(() => createAdminHubService(), []);
  const service = injected ?? fallback;
  const [state, setState] = useState<AdminLinksState>({ status: "loading", links: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    service
      .listAll(controller.signal)
      .then((links) => {
        if (!controller.signal.aborted && requestId === requestIdRef.current) setState({ status: "ready", links, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        if (error instanceof Error && error.name === "AbortError") return;
        setState({ status: "error", links: null, error: error instanceof Error ? error : new Error("Unable to load service links") });
      });
    return () => controller.abort();
  }, [service, attempt]);

  const reload = useCallback(() => {
    setState({ status: "loading", links: null, error: null });
    setAttempt((n) => n + 1);
  }, []);

  const replace = useCallback((saved: UniversityService) => {
    setState((s) => {
      if (s.status !== "ready") return s;
      const others = s.links.filter((l) => l.id !== saved.id);
      return { status: "ready", links: [...others, saved].sort(compareServices), error: null };
    });
    return saved;
  }, []);

  const create = useCallback(async (body: CreateServiceLinkDTO) => replace(await service.create(body)), [service, replace]);
  const update = useCallback(
    async (link: UniversityService, body: UpdateServiceLinkDTO) => replace(await service.update(link.id, body, link.version)),
    [service, replace],
  );
  const deactivate = useCallback(
    async (link: UniversityService) => replace(await service.deactivate(link.id, link.version)),
    [service, replace],
  );
  const reactivate = useCallback(
    async (link: UniversityService) => replace(await service.update(link.id, { isActive: true }, link.version)),
    [service, replace],
  );

  return { ...state, reload, create, update, deactivate, reactivate };
}
