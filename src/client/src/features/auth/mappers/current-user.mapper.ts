import { isRoleCode } from "@/libs/roles";
import type { CurrentUserContextWithGaps } from "@/features/auth/types/auth.dto";
import type { CurrentUser } from "@/features/auth/types/auth";

/** The account has no valid single role (UC-01 A6, GAP-O). */
export class InvalidRoleError extends Error {
  constructor() {
    super("The account has no valid role.");
    this.name = "InvalidRoleError";
  }
}

type ContextData = CurrentUserContextWithGaps["data"];

export function toCurrentUser(data: ContextData): CurrentUser {
  const { user, permissions } = data;
  if (!isRoleCode(user?.role)) {
    throw new InvalidRoleError();
  }
  const faculty = user.academicInfo?.faculty;
  return {
    id: user.id ?? "",
    email: user.email ?? "",
    fullName: user.fullName ?? "",
    role: user.role,
    status: user.status === "inactive" ? "inactive" : "active",
    avatarUrl: user.avatarUrl ?? null,
    studentNumber: user.academicInfo?.studentNumber ?? null,
    faculty:
      faculty && faculty.id
        ? { id: faculty.id, code: faculty.code ?? "", name: faculty.name ?? "" }
        : null,
    permissions: Array.isArray(permissions) ? permissions : [],
    mustChangePassword: user.mustChangePassword === true,
  };
}
