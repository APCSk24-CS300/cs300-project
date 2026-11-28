/** The only roles in myHCMUS (contract `UserRole`). Each account has exactly one. */
export const ROLE_CODES = ["student", "manager", "administrator"] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const ROLE_LABEL: Record<RoleCode, string> = {
  student: "Student",
  manager: "Manager",
  administrator: "Administrator",
};

/** URL area of each role. URLs are not role codes (`/admin` belongs to `administrator`). */
export const ROLE_ROUTE_PREFIX: Record<RoleCode, string> = {
  student: "/student",
  manager: "/manager",
  administrator: "/admin",
};

export function isRoleCode(value: unknown): value is RoleCode {
  return (
    typeof value === "string" &&
    (ROLE_CODES as readonly string[]).includes(value)
  );
}

/** The role that owns a path, or null when the path is not inside any role area. */
export function getRoleForPath(pathname: string): RoleCode | null {
  for (const role of ROLE_CODES) {
    const prefix = ROLE_ROUTE_PREFIX[role];
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return role;
    }
  }
  return null;
}
