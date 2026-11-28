"use client";

import { useCallback, useEffect, useState } from "react";
import { isForbiddenError } from "@/hooks/useForbidden";

export type ResourceStatus = "loading" | "error" | "forbidden" | "success";

export interface Resource<T> {
  status: ResourceStatus;
  data: T | null;
  error: unknown;
  retry: () => void;
}

interface Settled<T> {
  key: string;
  status: Exclude<ResourceStatus, "loading">;
  data: T | null;
  error: unknown;
}

/**
 * Shared read-hook core (admin-users, University Services Hub): loading / error / forbidden / success (FR-026),
 * with `isForbiddenError` per the T030 wiring rule (no useForbidden inside hooks).
 * "loading" is derived (the last settled result belongs to another request key), so no
 * state is set synchronously inside the effect.
 */
export function useAsyncResource<T>(load: () => Promise<T>, deps: unknown[], enabled = true): Resource<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const key = JSON.stringify([deps, attempt]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    load()
      .then((data) => {
        if (active) setSettled({ key, status: "success", data, error: null });
      })
      .catch((error: unknown) => {
        if (active) setSettled({ key, status: isForbiddenError(error) ? "forbidden" : "error", data: null, error });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (!settled || settled.key !== key) {
    return { status: "loading", data: null, error: null, retry };
  }
  return { status: settled.status, data: settled.data, error: settled.error, retry };
}
