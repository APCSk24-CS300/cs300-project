"use client";

import { adminUsersService } from "@/features/admin-users/services/admin-users.service";
import type { Faculty } from "@/features/admin-users/types/admin-users";
import { useAsyncResource } from "@/features/admin-users/hooks/useAsyncResource";

export function useFaculties(enabled = true) {
  return useAsyncResource<Faculty[]>(() => adminUsersService.listFaculties(), ["faculties"], enabled);
}
