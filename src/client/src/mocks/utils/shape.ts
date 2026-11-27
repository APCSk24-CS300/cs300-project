import type { MockDb, MockUser } from "@/mocks/db/types";

/** Builds contract-shaped payloads (openapi.yaml + gap fields) from mock records. */

export function apiUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1").replace(/\/+$/, "");
  return `${base}${path}`;
}

function facultyOf(db: MockDb, user: MockUser) {
  const faculty = db.faculties.find((f) => f.id === user.facultyId);
  return faculty ? { id: faculty.id, code: faculty.code, name: faculty.name } : null;
}

export function permissionsOf(db: MockDb, user: MockUser): string[] {
  if (!user.role) {
    return [];
  }
  const role = db.roles.find((r) => r.code === user.role);
  return role ? (db.rolePermissions[role.id] ?? []) : [];
}

/** `Profile` + gap fields `role: null` (GAP-O) and `mustChangePassword` (GAP-M). */
export function toProfile(db: MockDb, user: MockUser) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    avatarUrl: null,
    academicInfo:
      user.role === "student"
        ? {
            studentNumber: user.studentNumber,
            faculty: facultyOf(db, user),
            major: null,
            enrollmentYear: null,
          }
        : null,
    role: user.role,
    interests: [],
    status: user.status,
    mustChangePassword: user.mustChangePassword,
  };
}

/** `AdminUser`. `permissions` only in single-user responses. */
export function toAdminUser(db: MockDb, user: MockUser, withPermissions: boolean) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    status: user.status,
    studentNumber: user.studentNumber,
    faculty: facultyOf(db, user),
    role: user.role,
    ...(withPermissions ? { permissions: permissionsOf(db, user) } : {}),
    createdAt: user.createdAt,
    version: user.version,
  };
}
