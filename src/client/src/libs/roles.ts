export const ROLE_CODES = ["student", "manager", "admin"] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const ROLE_RULES: {prefix: string; roles: RoleCode[]}[] = [
    {prefix: "/services", roles: ["student", "manager", "admin"]},
    {prefix: "/student", roles: ["student"]},
    {prefix: "/manager", roles: ["manager"]},
    {prefix: "/admin", roles: ["admin"]},
];



/** Role codes used by the backend and database ("Role".code). The frontend says "admin" for "administrator". */
export type BackendRoleCode = "student" | "manager" | "administrator";

export function toBackendRole(role: RoleCode): BackendRoleCode {
    return role === "admin" ? "administrator" : role;
}

export function fromBackendRole(role: string): RoleCode | null {
    if (role === "administrator") return "admin";
    return role === "student" || role === "manager" ? role : null;
}
