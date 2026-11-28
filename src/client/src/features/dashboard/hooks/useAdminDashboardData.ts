"use client";

import { useCallback, useEffect, useState } from "react";
import { adminUsersService } from "@/features/admin-users/services/admin-users.service";
import type { AccountSummary, Faculty } from "@/features/admin-users/types/admin-users";

export interface AdminDashboardMetrics {
  totalUsers: number;
  studentCount: number;
  managerCount: number;
  adminCount: number;
  facultiesCount: number;
  faculties: Faculty[];
  recentUsers: AccountSummary[];
}

export type AdminDashboardState =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: AdminDashboardMetrics; error: null }
  | { status: "error"; data: null; error: unknown };

/**
 * Fetches real administrator dashboard metrics from existing admin-users endpoints.
 * Never fabricates numbers; exposes loading and error states cleanly.
 */
export function useAdminDashboardData(enabled: boolean) {
  const [state, setState] = useState<AdminDashboardState>({
    status: "loading",
    data: null,
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setState({ status: "loading", data: null, error: null });
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    Promise.all([
      adminUsersService.listUsers({ page: 1, search: "", role: undefined }, controller.signal),
      adminUsersService.listUsers({ page: 1, search: "", role: "student" }, controller.signal),
      adminUsersService.listUsers({ page: 1, search: "", role: "manager" }, controller.signal),
      adminUsersService.listUsers({ page: 1, search: "", role: "administrator" }, controller.signal),
      adminUsersService.listFaculties(),
    ])
      .then(([allPage, studentPage, managerPage, adminPage, faculties]) => {
        if (controller.signal.aborted) return;
        setState({
          status: "success",
          data: {
            totalUsers: allPage.totalItems,
            studentCount: studentPage.totalItems,
            managerCount: managerPage.totalItems,
            adminCount: adminPage.totalItems,
            facultiesCount: faculties.length,
            faculties,
            recentUsers: allPage.items.slice(0, 5),
          },
          error: null,
        });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState({ status: "error", data: null, error: err });
      });

    return () => controller.abort();
  }, [enabled, reloadKey]);

  return { ...state, retry };
}
