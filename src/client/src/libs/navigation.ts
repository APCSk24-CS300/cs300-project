import { getRoleForPath, isRoleCode, type RoleCode } from "@/libs/roles";

export type NavItemStatus = "available" | "coming-soon";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  status: NavItemStatus;
  /** Use case the destination traces to. */
  ucId: string;
}

/**
 * Role navigation (spec FR-024, user-flow.md §1.5; its second list is the manager's).
 * University Services (`/services`, UC-07) is shared by every role; Service Links is the
 * administrator's hub configuration (BR-ADM-01). docs-changes DOC-11.
 * Only destinations built in this phase are `available`; switching an item on later
 * is a one-line change here (FR-024, FR-024a).
 */
export const NAVIGATION: Record<RoleCode, NavItem[]> = {
  student: [
    { id: "dashboard", label: "Dashboard", href: "/student/dashboard", status: "available", ucId: "UC-32" },
    { id: "activities", label: "Activities", href: "/student/activities", status: "coming-soon", ucId: "UC-04" },
    { id: "drs", label: "DRS Management", href: "/student/drs", status: "coming-soon", ucId: "UC-24" },
    { id: "registrations", label: "My Registrations", href: "/student/registrations", status: "coming-soon", ucId: "UC-12" },
    { id: "calendar", label: "Calendar", href: "/student/calendar", status: "coming-soon", ucId: "UC-15" },
    { id: "assistant", label: "AI Student Assistant", href: "/student/assistant", status: "coming-soon", ucId: "UC-06" },
    { id: "services", label: "University Services", href: "/services", status: "available", ucId: "UC-07" },
    { id: "profile", label: "Profile", href: "/student/profile", status: "coming-soon", ucId: "UC-03" },
  ],
  manager: [
    { id: "dashboard", label: "Dashboard", href: "/manager/dashboard", status: "available", ucId: "UC-32" },
    { id: "activities", label: "Activity Management", href: "/manager/activities", status: "coming-soon", ucId: "UC-18" },
    { id: "registrations", label: "Registration Management", href: "/manager/registrations", status: "coming-soon", ucId: "UC-14" },
    { id: "attendance", label: "Attendance and Results", href: "/manager/attendance", status: "coming-soon", ucId: "UC-21" },
    { id: "appeals", label: "Appeals", href: "/manager/appeals", status: "coming-soon", ucId: "UC-28" },
    { id: "reports", label: "Reports", href: "/manager/reports", status: "coming-soon", ucId: "UC-20" },
    { id: "services", label: "University Services", href: "/services", status: "available", ucId: "UC-07" },
    { id: "profile", label: "Profile", href: "/manager/profile", status: "coming-soon", ucId: "UC-03" },
  ],
  administrator: [
    { id: "dashboard", label: "Dashboard", href: "/admin/dashboard", status: "available", ucId: "UC-32" },
    { id: "users", label: "User Management", href: "/admin/users", status: "available", ucId: "UC-29" },
    { id: "service-links", label: "Service Links", href: "/admin/services", status: "available", ucId: "UC-30" },
    { id: "categories", label: "Activity Categories", href: "/admin/categories", status: "coming-soon", ucId: "UC-30" },
    { id: "configuration", label: "System Configuration", href: "/admin/configuration", status: "coming-soon", ucId: "UC-30" },
    { id: "reports", label: "Reports and Analytics", href: "/admin/reports", status: "coming-soon", ucId: "UC-31" },
    { id: "audit", label: "Audit Logs", href: "/admin/audit-logs", status: "coming-soon", ucId: "UC-29" },
    { id: "services", label: "University Services", href: "/services", status: "available", ucId: "UC-07" },
    { id: "profile", label: "Profile", href: "/admin/profile", status: "coming-soon", ucId: "UC-03" },
  ],
};

export function getDashboardPath(role?: RoleCode | null): string {
  if (!isRoleCode(role)) {
    return "/login";
  }
  return NAVIGATION[role].find((item) => item.id === "dashboard")?.href ?? "/login";
}

export function isSafeRedirectPath(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return false;
  }

  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) {
    return false;
  }

  try {
    const url = new URL(value, "https://myhcmus.local");

    if (url.origin !== "https://myhcmus.local") {
      return false;
    }

    if (url.pathname === "/login" || url.pathname.startsWith("/login/")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/** A safe return path the given role may open: same-origin, not /login, not another role's area. */
export function isPathAllowedForRole(path: unknown, role: RoleCode): path is string {
  if (!isSafeRedirectPath(path)) {
    return false;
  }
  const pathname = new URL(path, "https://myhcmus.local").pathname;
  if (pathname === "/change-password") {
    return false;
  }
  const owner = getRoleForPath(pathname);
  return owner === null || owner === role;
}

export function getLoginHref(returnTo?: string): string {
  if (!returnTo || !isSafeRedirectPath(returnTo)) {
    return "/login";
  }

  return `/login?redirectTo=${encodeURIComponent(returnTo)}`;
}
