import { hasActivities } from "@/features/activities/mappers/activity.mapper";
import { createActivityService } from "@/features/activities/services/activity.service.factory";
import type { ActivityService } from "@/features/activities/services/activity.service";
import type { LandingActivities } from "@/features/activities/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type LandingActivitiesStatus = "loading" | "success" | "empty" | "error";

export type UseLandingActivitiesResult =
  | {
      status: "loading";
      data: null;
      error: null;
      refetch: () => void;
    }
  | {
      status: "success";
      data: LandingActivities;
      error: null;
      refetch: () => void;
    }
  | {
      status: "empty";
      data: LandingActivities;
      error: null;
      refetch: () => void;
    }
  | {
      status: "error";
      data: null;
      error: Error;
      refetch: () => void;
    };

type State =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: LandingActivities; error: null }
  | { status: "empty"; data: LandingActivities; error: null }
  | { status: "error"; data: null; error: Error };

function toError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error("Unable to load activities");
}

export function useLandingActivities(
  injectedService?: ActivityService,
): UseLandingActivitiesResult {
  const defaultService = useMemo(() => createActivityService(), []);
  const service = injectedService ?? defaultService;
  const [state, setState] = useState<State>({
    status: "loading",
    data: null,
    error: null,
  });
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const startRequest = useCallback(() => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    controllerRef.current = controller;

    setState({ status: "loading", data: null, error: null });

    service
      .getLandingActivities(controller.signal)
      .then((data) => {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current ||
          controller.signal.aborted
        ) {
          return;
        }

        if (hasActivities(data)) {
          setState({ status: "success", data, error: null });
        } else {
          setState({ status: "empty", data, error: null });
        }
      })
      .catch((error: unknown) => {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current ||
          controller.signal.aborted ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          return;
        }

        setState({ status: "error", data: null, error: toError(error) });
      });
  }, [service]);

  useEffect(() => {
    mountedRef.current = true;
    controllerRef.current?.abort();

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    controllerRef.current = controller;

    service
      .getLandingActivities(controller.signal)
      .then((data) => {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current ||
          controller.signal.aborted
        ) {
          return;
        }

        if (hasActivities(data)) {
          setState({ status: "success", data, error: null });
        } else {
          setState({ status: "empty", data, error: null });
        }
      })
      .catch((error: unknown) => {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current ||
          controller.signal.aborted ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          return;
        }

        setState({ status: "error", data: null, error: toError(error) });
      });

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      controller.abort();
    };
  }, [service]);

  const refetch = useCallback(() => {
    startRequest();
  }, [startRequest]);

  return { ...state, refetch } as UseLandingActivitiesResult;
}
