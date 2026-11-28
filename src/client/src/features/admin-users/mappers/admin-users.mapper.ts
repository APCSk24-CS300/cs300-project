import { isRoleCode, type RoleCode } from "@/libs/roles";
import type {
  AdminUserDTO,
  CreateUserRequestWithPassword,
  FacultySummaryDTO,
  RolePermissionsResponseDTO,
  UserListResponseDTO,
} from "@/features/admin-users/types/admin-users.dto";
import type {
  AccountPage,
  AccountSummary,
  Faculty,
  NewAccountDraft,
  RolePermissions,
} from "@/features/admin-users/types/admin-users";

export function toAccountSummary(dto: AdminUserDTO): AccountSummary {
  return {
    id: dto.id ?? "",
    fullName: dto.fullName ?? "",
    email: dto.email ?? "",
    role: isRoleCode(dto.role) ? dto.role : null,
    status: dto.status === "inactive" ? "inactive" : "active",
    studentNumber: dto.studentNumber ?? null,
    createdAt: new Date(dto.createdAt ?? 0),
  };
}

export function toAccountPage(dto: UserListResponseDTO["data"]): AccountPage {
  return {
    items: (dto.items ?? []).map(toAccountSummary),
    page: dto.pagination.page,
    limit: dto.pagination.limit,
    totalItems: dto.pagination.totalItems,
    totalPages: Math.max(1, dto.pagination.totalPages),
  };
}

/** Drops student fields for non-students, '' → null, trims phone, temporaryPassword → initialPassword (GAP-C). */
export function toCreateUserRequest(draft: NewAccountDraft): CreateUserRequestWithPassword {
  const isStudent = draft.role === "student";
  const phone = draft.phoneNumber.trim();
  return {
    email: draft.email.trim().toLowerCase(),
    fullName: draft.fullName.trim(),
    role: draft.role,
    studentNumber: isStudent ? draft.studentNumber.trim() || null : null,
    facultyId: isStudent ? draft.facultyId || null : null,
    phoneNumber: phone || null,
    initialPassword: draft.temporaryPassword,
  };
}

export function toRolePermissions(role: RoleCode, dto: RolePermissionsResponseDTO["data"]): RolePermissions {
  return {
    role,
    permissions: (dto.permissions ?? [])
      .filter((p) => typeof p.code === "string")
      .map((p) => ({ code: p.code as string, description: p.description ?? "" })),
  };
}

export function toFaculty(dto: FacultySummaryDTO): Faculty | null {
  if (!dto.id || !dto.name) {
    return null;
  }
  return { id: dto.id, code: dto.code ?? "", name: dto.name };
}

export function toFaculties(dtos: FacultySummaryDTO[]): Faculty[] {
  return dtos
    .map(toFaculty)
    .filter((f): f is Faculty => f !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
}
