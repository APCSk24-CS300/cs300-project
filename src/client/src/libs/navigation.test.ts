import { describe, expect, it } from "vitest";
import {
  NAVIGATION,
  getDashboardPath,
  getLoginHref,
  isPathAllowedForRole,
  isSafeRedirectPath,
} from "@/libs/navigation";

describe("navigation", () => {
  it("resolves the dashboard of each role", () => {
    expect(getDashboardPath("student")).toBe("/student/dashboard");
    expect(getDashboardPath("manager")).toBe("/manager/dashboard");
    expect(getDashboardPath("administrator")).toBe("/admin/dashboard");
    expect(getDashboardPath(null)).toBe("/login");
  });

  it("lists exactly the FR-024 items, with only built pages available", () => {
    expect(NAVIGATION.student.map((i) => i.label)).toEqual([
      "Dashboard", "Activities", "DRS Management", "My Registrations",
      "Calendar", "AI Student Assistant", "University Services", "Profile",
    ]);
    expect(NAVIGATION.manager.map((i) => i.label)).toEqual([
      "Dashboard", "Activity Management", "Registration Management",
      "Attendance and Results", "Appeals", "Reports", "University Services", "Profile",
    ]);
    expect(NAVIGATION.administrator.map((i) => i.label)).toEqual([
      "Dashboard", "User Management", "Service Links", "Activity Categories",
      "System Configuration", "Reports and Analytics", "Audit Logs", "University Services", "Profile",
    ]);
    const available = Object.values(NAVIGATION)
      .flat()
      .filter((i) => i.status === "available")
      .map((i) => i.href);
    expect(available.sort()).toEqual(
      [
        "/admin/dashboard", "/admin/users", "/admin/services", "/manager/dashboard", "/student/dashboard",
        "/services", "/services", "/services",
      ].sort(),
    );
  });

  it("builds safe login hrefs", () => {
    expect(getLoginHref("/#services")).toBe("/login?redirectTo=%2F%23services");
    expect(getLoginHref()).toBe("/login");
    expect(getLoginHref("https://evil.example")).toBe("/login");
  });

  it("rejects unsafe redirect targets", () => {
    expect(isSafeRedirectPath("//evil.example")).toBe(false);
    expect(isSafeRedirectPath("/login")).toBe(false);
    expect(isSafeRedirectPath("/student/dashboard")).toBe(true);
  });

  it("only allows return paths inside the user's own area", () => {
    expect(isPathAllowedForRole("/student/dashboard", "student")).toBe(true);
    expect(isPathAllowedForRole("/admin/users", "student")).toBe(false);
    expect(isPathAllowedForRole("/admin/users?page=2", "administrator")).toBe(true);
    expect(isPathAllowedForRole("/#services", "manager")).toBe(true);
    expect(isPathAllowedForRole("https://evil.example", "manager")).toBe(false);
  });
  it("/services is a safe return path for every role", () => {
    for (const role of ["student", "manager", "administrator"] as const) {
      expect(isPathAllowedForRole("/services", role)).toBe(true);
    }
    expect(getLoginHref("/services")).toBe("/login?redirectTo=%2Fservices");
    expect(isPathAllowedForRole("/admin/services", "student")).toBe(false);
  });
});
