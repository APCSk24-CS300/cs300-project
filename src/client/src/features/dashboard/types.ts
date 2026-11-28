import type { RoleCode } from "@/libs/roles";

/** What the dashboard needs about the user; passed in as a prop (no import of auth internals, C-II). */
export interface DashboardUser {
  fullName: string;
  email: string;
  role: RoleCode;
  studentNumber: string | null;
  faculty: { name: string } | null;
}
