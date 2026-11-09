export const ROLE_CODES = ["student", "organizer", "admin"] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const ROLE_RULES: {prefix: string; roles: RoleCode[]}[] = [
    {prefix: "/student", roles: ["student"]},
    {prefix: "/organizer", roles: ["organizer"]},
    {prefix: "/admin", roles: ["admin"]},
];

