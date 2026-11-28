import { api, unwrap } from "@/libs/api-client";
import type { RoleCode } from "@/libs/roles";
import {
  toAccountPage,
  toAccountSummary,
  toCreateUserRequest,
  toFaculties,
  toRolePermissions,
} from "@/features/admin-users/mappers/admin-users.mapper";
import type {
  AdminUserResponseDTO,
  FacultyListResponseDTO,
  RoleListResponseDTO,
  RolePermissionsResponseDTO,
  UserListResponseDTO,
} from "@/features/admin-users/types/admin-users.dto";
import type {
  AccountListQuery,
  AccountPage,
  AccountSummary,
  Faculty,
  NewAccountDraft,
  RolePermissions,
} from "@/features/admin-users/types/admin-users";

/** UC-29 service contract (C-IV v1.1.0): one HTTP implementation, mocked by MSW. Domain types only (C-V). */
export interface AdminUsersService {
  listUsers(query: AccountListQuery, signal?: AbortSignal): Promise<AccountPage>;
  createUser(draft: NewAccountDraft): Promise<AccountSummary>;
  listFaculties(): Promise<Faculty[]>;
  getRolePermissions(role: RoleCode): Promise<RolePermissions>;
}

export const ACCOUNT_PAGE_SIZE = 10;

class HttpAdminUsersService implements AdminUsersService {
  async listUsers(query: AccountListQuery, signal?: AbortSignal) {
    const params = new URLSearchParams({
      page: String(query.page),
      limit: String(ACCOUNT_PAGE_SIZE),
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    if (query.search?.trim()) params.set("search", query.search.trim());
    if (query.role) params.set("role", query.role);
    const response = await api.get<UserListResponseDTO>(`/admin/users?${params.toString()}`, { signal });
    return toAccountPage(response.data);
  }

  async createUser(draft: NewAccountDraft) {
    const response = await api.post<AdminUserResponseDTO>("/admin/users", toCreateUserRequest(draft));
    return toAccountSummary(unwrap(response));
  }

  async listFaculties() {
    const response = await api.get<FacultyListResponseDTO>("/admin/faculties");
    return toFaculties(response.data ?? []);
  }

  async getRolePermissions(role: RoleCode) {
    const roles = unwrap(await api.get<RoleListResponseDTO>("/admin/roles"));
    const match = roles.find((r) => r.code === role);
    if (!match?.id) {
      return { role, permissions: [] };
    }
    const response = await api.get<RolePermissionsResponseDTO>(`/admin/roles/${encodeURIComponent(match.id)}/permissions`);
    return toRolePermissions(role, unwrap(response));
  }
}

export const adminUsersService: AdminUsersService = new HttpAdminUsersService();
