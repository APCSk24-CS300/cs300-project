export const ROLE_CODES = ["student", "manager", "admin"] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const ROLE_RULES: {prefix: string; roles: RoleCode[]}[] = [
    {prefix: "/student", roles: ["student"]},
    {prefix: "/manager", roles: ["manager"]},
    {prefix: "/admin", roles: ["admin"]},
];

