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
  /** Same-origin avatar URL as the BE stores it (`/api/v1/profile/avatar/files/{name}`), or null (plan 006). */
  avatarUrl: string | null;
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

/**
 * A University Services Hub link (BR `ServiceLink`, contract `UniversityService` incl. `version`).
 * Same shape as the backend sends (src/server/src/types/ServiceLink.ts).
 */
export interface MockServiceLink {
  id: string;
  name: string;
  url: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  version: number;
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
  | "listRoles"
  | "listServices"
  | "manageServiceLinks"
  | "getProfile"
  | "updateProfile"
  | "uploadAvatar"
  | "removeAvatar";
/** `:conflict` = the BE's 409 when another avatar update won the compare-and-set (UC-03 A9). */
export type OperationId = OperationName | `${OperationName}:network` | "uploadAvatar:conflict" | "removeAvatar:conflict";

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
  /** Hub links (plan 005). Older stores lack them; `readDb` migrates (see store.ts). */
  serviceLinks: MockServiceLink[];
  nextServiceLinkId: number;
}
