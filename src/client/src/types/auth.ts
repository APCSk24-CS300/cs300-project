import type { ID, RoleCode, PermissionCode } from "./entities";

/** Cumulative: each role includes everything below it. */
export const ROLE_RANK: Record<RoleCode, number> = {
  student: 0,
  organizer: 1,
  administrator: 2,
};

interface SessionUserBase {
  userId: ID;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  permissions: PermissionCode[];
}

export interface StudentSessionUser extends SessionUserBase {
  role: "student";
  studentNumber: string;
  facultyId: ID;
}

export interface StaffSessionUser extends SessionUserBase {
  role: Exclude<RoleCode, "student">;
  studentNumber: string | null;
  facultyId: ID | null;
}

export type SessionUser = StudentSessionUser | StaffSessionUser;

export type UserWithStudentProfile = SessionUser & {
  studentNumber: string;
  facultyId: ID;
};

export function hasStudentProfile(user: SessionUser): user is UserWithStudentProfile {
  return user.studentNumber !== null && user.facultyId !== null;
}