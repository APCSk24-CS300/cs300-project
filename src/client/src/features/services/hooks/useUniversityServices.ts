"use client";

import { hubService, type HubService } from "@/features/services/services/hub.service";
import type { UniversityService } from "@/features/services/types/service";
import { useCallback, useEffect, useRef, useState } from "react";

export type UniversityServicesState =
  | { status: "loading"; services: null; error: null }
  | { status: "success"; services: UniversityService[]; error: null }
  | { status: "empty"; services: []; error: null }
  | { status: "error"; services: null; error: Error };

export type UseUniversityServicesResult = UniversityServicesState & { refetch: () => void };

const LOADING: UniversityServicesState = { status: "loading", services: null, error: null };

/**
 * Loads the active university services. Cancels the request on unmount and ignores stale answers
 * when `refetch` is called again before the first one finishes. Pass `enabled=false` to skip loading
 * (e.g. for guests on the landing page).
 */
export function useUniversityServices(
  injectedService?: HubService,
  enabled = true,
): UseUniversityServicesResult {
  const service = injectedService ?? hubService;
  const [state, setState] = useState<UniversityServicesState>(LOADING);
  const [attempt, setAttempt] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    service
      .listServices()
      .then((services) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        setState(
          services.length > 0
            ? { status: "success", services, error: null }
            : { status: "empty", services: [], error: null },
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        if (error instanceof Error && error.name === "AbortError") return;
        setState({
          status: "error",
          services: null,
          error: error instanceof Error ? error : new Error("Unable to load university services"),
        });
      });

    return () => controller.abort();
  }, [service, enabled, attempt]);

  const refetch = useCallback(() => {
    setState(LOADING);
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, refetch } as UseUniversityServicesResult;
}
