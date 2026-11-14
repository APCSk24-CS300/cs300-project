import { ROLE_CODES, RoleCode } from "@/libs/roles";

// for side bar items
export const NAVIGATION_ITEMS: Record<
  RoleCode,
  { label: string; href: string }[]
> = {
  student: [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Activities", href: "/student/activities" },
  ],
  manager: [{ label: "Dashboard", href: "/manager/dashboard" }],
  admin: [{ label: "Dashboard", href: "/admin/dashboard" }],
};

export function getDashboardPath(role?: RoleCode | null): string {
  if (!role || !ROLE_CODES.includes(role)) {
    return "/login";
  }

  return (
    NAVIGATION_ITEMS[role].find((item) => item.label === "Dashboard")?.href ??
    "/login"
  );
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

export function getLoginHref(returnTo?: string): string {
  if (!returnTo || !isSafeRedirectPath(returnTo)) {
    return "/login";
  }

  return `/login?redirectTo=${encodeURIComponent(returnTo)}`;
}
