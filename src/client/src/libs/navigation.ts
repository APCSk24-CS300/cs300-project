import { ROLE_CODES, RoleCode } from "@/libs/roles"

// for side bar items
export const NAVIGATION_ITEMS: Record<RoleCode, {label: string; href: string }[]> = {
    student: [
        {label: 'Dashboard', href: '/student/dashboard'},
        {label: 'Activities', href: '/student/activities'}
        
    ],
    organizer: [{label: 'Dashboard', href: '/organizer/dashboard'}],
    admin: [{label: 'Dashboard', href: '/admin/dashboard'}],
};