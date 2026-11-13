import { RoleCode } from "@/libs/roles";

export type ID = number;
export type ISODateString = string;


export const PERMISSION_CODES = [
  "registration.create",
  "registration.review",
  "activity.manage",
  "attendance.record",
  "score.submit",
  "score.adjust",
  "appeal.submit",
  "appeal.review",
  "criteria.manage",
  "reports.view",
  "role.manage", 
] as const;
export type PermissionCode = (typeof PERMISSION_CODES)[number];




export interface Role {
  roleId: ID;
  code: RoleCode;
  name: string;
  description: string;
}

export interface Permission {
  permissionId: ID;
  code: PermissionCode;
  description: string;
}

export interface RolePermission {
  roleId: ID;
  permissionId: ID;
}

export interface Faculty {
  facultyId: ID;
  code: string;
  name: string;
}

export interface Semester {
  semesterId: ID;
  academicYear: string; 
  term: string; 
  startsAt: ISODateString;
  endsAt: ISODateString;
}

export interface User {
  userId: ID;
  roleId: ID;
  email: string;
  passwordHash: string; 
  fullName: string;
  studentNumber: string | null;
  facultyId: ID | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: ISODateString;
}

export type PublicUser = Omit<User, "passwordHash">;

export interface UserInterest {
  userId: ID;
  categoryId: ID;
}