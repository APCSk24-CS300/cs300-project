"use client";

import { useCallback, useRef, useState } from "react";
import { adminUsersService } from "@/features/admin-users/services/admin-users.service";
import type { AccountSummary, NewAccountDraft } from "@/features/admin-users/types/admin-users";

/** Mutation hook: one in-flight request at a time (FR-037). Rejects with the ApiError. */
export function useCreateAccount() {
  const inFlight = useRef<Promise<AccountSummary> | null>(null);
  const [pending, setPending] = useState(false);

  const submit = useCallback((draft: NewAccountDraft) => {
    if (inFlight.current) {
      return inFlight.current;
    }
    setPending(true);
    const request = adminUsersService.createUser(draft).finally(() => {
      inFlight.current = null;
      setPending(false);
    });
    inFlight.current = request;
    return request;
  }, []);

  return { submit, pending };
}
