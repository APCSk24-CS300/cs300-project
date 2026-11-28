import type { RoleCode } from "@/libs/roles";

export type AccountStatus = "active" | "inactive";

/** data-model §2.5 */
export interface AccountSummary {
  id: string;
  fullName: string;
  email: string;
  /** null only for a broken account (no valid role) coming from the server. */
  role: RoleCode | null;
  status: AccountStatus;
  studentNumber: string | null;
  createdAt: Date;
}

export interface AccountPage {
  items: AccountSummary[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface AccountListQuery {
  search?: string;
  role?: RoleCode;
  page: number;
}

/** data-model §2.6 — wizard form state. */
export interface NewAccountDraft {
  email: string;
  fullName: string;
  role: RoleCode;
  phoneNumber: string;
  studentNumber: string;
  facultyId: string;
  temporaryPassword: string;
  passwordOverridden: boolean;
}

/** data-model §2.7 — held only in the wizard's memory (FR-036c). */
export interface CreatedAccount {
  account: AccountSummary;
  temporaryPassword: string;
}

/** data-model §2.8 */
export interface RolePermissions {
  role: RoleCode;
  permissions: { code: string; description: string }[];
}

/** data-model §2.10 (analysis C3: components never see FacultySummary). */
export interface Faculty {
  id: string;
  code: string;
  name: string;
}
