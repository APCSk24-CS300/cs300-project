"use client";

import type { RoleCode } from "@/libs/roles";
import { adminUsersService } from "@/features/admin-users/services/admin-users.service";
import type { RolePermissions } from "@/features/admin-users/types/admin-users";
import { useAsyncResource } from "@/features/admin-users/hooks/useAsyncResource";

export function useRolePermissions(role: RoleCode, enabled = true) {
  return useAsyncResource<RolePermissions>(() => adminUsersService.getRolePermissions(role), [role], enabled);
}
