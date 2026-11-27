import type { RoleCode } from "@/libs/roles";

export type AccountStatus = "active" | "inactive";

/** A user in the mock store (data-model §4). `passwordPlain` exists only in the mock. */
export interface MockUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: RoleCode | null;
  status: AccountStatus;
  studentNumber: string | null;
  facultyId: string | null;
  passwordPlain: string;
  mustChangePassword: boolean;
  version: number;
  createdAt: string;
}

export interface MockFaculty {
  id: string;
  code: string;
  name: string;
}

export interface MockRole {
  id: string;
  code: RoleCode;
  name: string;
  description: string;
}

export interface MockPermission {
  id: string;
  code: string;
  description: string;
}

/** Failure-switch operation ids (contracts/mock-api.md). `:network` = network error instead of 500. */
export type OperationName =
  | "login"
  | "logout"
  | "me"
  | "changePassword"
  | "listUsers"
  | "createUser"
  | "listFaculties"
  | "listRoles";
export type OperationId = OperationName | `${OperationName}:network`;

export interface MockDb {
  version: 1;
  users: MockUser[];
  faculties: MockFaculty[];
  roles: MockRole[];
  permissions: MockPermission[];
  rolePermissions: Record<string, string[]>;
  /** Tokens issued by the mock: jti -> user id. Unknown jti = forged token. */
  issuedTokens: Record<string, string>;
  revokedTokenIds: string[];
  loginAttempts: Record<string, { consecutiveFailures: number; lockedUntil?: string }>;
  failures: OperationId[];
  nextUserSeq: number;
}
