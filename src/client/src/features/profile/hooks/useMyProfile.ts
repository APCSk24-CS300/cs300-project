"use client";

import { useCallback, useMemo, useState } from "react";
import { useAsyncResource, type ResourceStatus } from "@/hooks/useAsyncResource";
import { profileService, type ProfileService } from "@/features/profile/services/profile.service";
import type { Profile } from "@/features/profile/types/profile";

export interface MyProfileState {
  status: ResourceStatus;
  /** The server profile with the user's saved changes applied; null unless `success`. */
  profile: Profile | null;
  error: unknown;
  /** Reload from the server; drops locally applied changes. */
  retry: () => void;
  /** Apply a server-confirmed change (the response of a save) without reloading. */
  apply: (patch: Partial<Profile>) => void;
}

/**
 * UC-03 step 2: the caller's own profile (`GET /profile`) on the shared `useAsyncResource` core:
 * loading / success / error (retry, A9) / forbidden (wiring rule: `isForbiddenError`, no `useForbidden`).
 * Only server-confirmed values are applied, so nothing is shown as saved that the server did not save.
 */
export function useMyProfile(service: ProfileService = profileService): MyProfileState {
  const resource = useAsyncResource(() => service.getProfile(), ["my-profile"]);
  const [patch, setPatch] = useState<Partial<Profile>>({});

  const profile = useMemo(
    () => (resource.status === "success" && resource.data ? { ...resource.data, ...patch } : null),
    [resource.status, resource.data, patch],
  );

  const { retry: reload } = resource;
  const retry = useCallback(() => {
    setPatch({});
    reload();
  }, [reload]);

  const apply = useCallback((change: Partial<Profile>) => {
    setPatch((current) => ({ ...current, ...change }));
  }, []);

  return { status: resource.status, profile, error: resource.error, retry, apply };
}
