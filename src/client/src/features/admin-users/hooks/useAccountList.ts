"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { isRoleCode, type RoleCode } from "@/libs/roles";
import { adminUsersService } from "@/features/admin-users/services/admin-users.service";
import type { AccountPage } from "@/features/admin-users/types/admin-users";
import { useAsyncResource } from "@/features/admin-users/hooks/useAsyncResource";

export interface AccountListState {
  search: string;
  role: RoleCode | "";
  page: number;
}

const SEARCH_DEBOUNCE_MS = 300;

/**
 * UC-29 steps 1–2 / A1. State lives in the component and is mirrored into the URL
 * (search, role, page) so Back and reload keep it. Refetches on mount (FR-038).
 */
export function useAccountList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQueryState] = useState<AccountListState>(() => ({
    search: params.get("search") ?? "",
    role: isRoleCode(params.get("role")) ? (params.get("role") as RoleCode) : "",
    page: Math.max(1, Number(params.get("page")) || 1),
  }));
  const [debouncedSearch, setDebouncedSearch] = useState(query.search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(query.search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query.search]);

  // Stale responses are ignored by useAsyncResource's own abort flag; the signal is not passed
  // to fetch (it is not portable across realms, e.g. jsdom in tests).
  const resource = useAsyncResource<AccountPage>(
    () =>
      adminUsersService.listUsers({
        search: debouncedSearch || undefined,
        role: query.role || undefined,
        page: query.page,
      }),
    [debouncedSearch, query.role, query.page],
  );

  const syncUrl = useCallback(
    (next: AccountListState) => {
      const search = new URLSearchParams();
      if (next.search) search.set("search", next.search);
      if (next.role) search.set("role", next.role);
      if (next.page > 1) search.set("page", String(next.page));
      const qs = search.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false } as never);
    },
    [router, pathname],
  );

  // The URL is updated in the event handler, never inside a state updater: React runs
  // updaters during render, and updating the Router there triggers "Cannot update a
  // component (`Router`) while rendering a different component".
  const setQuery = useCallback(
    (patch: Partial<AccountListState>) => {
      const filterChanged = patch.search !== undefined || patch.role !== undefined;
      const next = { ...query, ...patch, page: filterChanged ? 1 : (patch.page ?? query.page) };
      setQueryState(next);
      syncUrl(next);
    },
    [query, syncUrl],
  );

  const clearFilters = useCallback(() => {
    const next = { search: "", role: "" as const, page: 1 };
    setQueryState(next);
    setDebouncedSearch("");
    syncUrl(next);
  }, [syncUrl]);

  return { ...resource, query, setQuery, clearFilters };
}
