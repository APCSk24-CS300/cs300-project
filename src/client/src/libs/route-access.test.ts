import { describe, expect, it } from "vitest";
import { resolveRouteAccess } from "@/libs/route-access";
import type { SessionHint } from "@/libs/session-hint";
import type { RoleCode } from "@/libs/roles";

const NOW = 1_000_000;
const hint = (role: RoleCode, mustChangePassword = false, exp = NOW + 3600): SessionHint => ({
  role,
  mustChangePassword,
  exp,
});

describe("resolveRouteAccess", () => {
  it("rule 1: public paths are allowed; /login with a valid hint goes to the dashboard", () => {
    expect(resolveRouteAccess("/", null, NOW)).toEqual({ type: "allow", noStore: false });
    expect(resolveRouteAccess("/login", null, NOW)).toEqual({ type: "allow", noStore: false });
    expect(resolveRouteAccess("/login", hint("student"), NOW)).toEqual({
      type: "redirect",
      to: "/student/dashboard",
    });
    expect(resolveRouteAccess("/login", hint("manager", true), NOW)).toEqual({
      type: "redirect",
      to: "/change-password",
    });
  });

  it("rule 2: protected paths without a valid hint go to sign-in with a return path", () => {
    expect(resolveRouteAccess("/admin/users", null, NOW, "?page=2")).toEqual({
      type: "redirect",
      to: "/login?redirectTo=%2Fadmin%2Fusers%3Fpage%3D2",
    });
    expect(resolveRouteAccess("/student/dashboard", hint("student", false, NOW - 1), NOW)).toMatchObject({
      type: "redirect",
      to: expect.stringMatching(/^\/login\?redirectTo=/),
    });
  });

  it("rule 3: a pending password change only allows /change-password", () => {
    expect(resolveRouteAccess("/student/dashboard", hint("student", true), NOW)).toEqual({
      type: "redirect",
      to: "/change-password",
    });
    expect(resolveRouteAccess("/change-password", hint("student", true), NOW)).toEqual({
      type: "allow",
      noStore: true,
    });
  });

  it("rule 4: /change-password without a pending change goes to the dashboard", () => {
    expect(resolveRouteAccess("/change-password", hint("administrator"), NOW)).toEqual({
      type: "redirect",
      to: "/admin/dashboard",
    });
  });

  it.each<[RoleCode, string, string]>([
    ["student", "/admin/users", "/forbidden"],
    ["student", "/manager/dashboard", "/forbidden"],
    ["manager", "/student/dashboard", "/forbidden"],
    ["administrator", "/manager/dashboard", "/forbidden"],
  ])("rule 5: %s opening %s is sent to %s", (role, path, to) => {
    expect(resolveRouteAccess(path, hint(role), NOW)).toEqual({ type: "redirect", to });
  });

  it.each<[RoleCode, string]>([
    ["student", "/student/dashboard"],
    ["manager", "/manager/dashboard"],
    ["administrator", "/admin/dashboard"],
    ["administrator", "/admin/users/new"],
    ["student", "/forbidden"],
  ])("rule 6: %s may open %s and the response is not cached", (role, path) => {
    expect(resolveRouteAccess(path, hint(role), NOW)).toEqual({ type: "allow", noStore: true });
  });
  describe("University Services Hub (plan 005)", () => {
    it("/services needs a session but is open to every role, without a role area", () => {
      expect(resolveRouteAccess("/services", null, NOW)).toEqual({
        type: "redirect",
        to: "/login?redirectTo=%2Fservices",
      });
      for (const role of ["student", "manager", "administrator"] as const) {
        expect(resolveRouteAccess("/services", hint(role), NOW)).toEqual({ type: "allow", noStore: true });
      }
    });

    it("/services still honors a pending password change", () => {
      expect(resolveRouteAccess("/services", hint("student", true), NOW)).toEqual({
        type: "redirect",
        to: "/change-password",
      });
    });

    it("/admin/services is the administrator's area", () => {
      expect(resolveRouteAccess("/admin/services", null, NOW)).toEqual({
        type: "redirect",
        to: "/login?redirectTo=%2Fadmin%2Fservices",
      });
      expect(resolveRouteAccess("/admin/services", hint("administrator"), NOW)).toEqual({ type: "allow", noStore: true });
      expect(resolveRouteAccess("/admin/services", hint("student"), NOW)).toEqual({ type: "redirect", to: "/forbidden" });
      expect(resolveRouteAccess("/admin/services", hint("manager"), NOW)).toEqual({ type: "redirect", to: "/forbidden" });
    });

    it("does not treat look-alike paths as the hub", () => {
      expect(resolveRouteAccess("/servicesX", null, NOW)).toEqual({ type: "allow", noStore: false });
    });
  });
  describe("My profile (plan 006 step 3)", () => {
    it("/profile needs a session, is open to every role and honors a pending password change", () => {
      expect(resolveRouteAccess("/profile", null, NOW)).toEqual({ type: "redirect", to: "/login?redirectTo=%2Fprofile" });
      for (const role of ["student", "manager", "administrator"] as const) {
        expect(resolveRouteAccess("/profile", hint(role), NOW)).toEqual({ type: "allow", noStore: true });
      }
      expect(resolveRouteAccess("/profile", hint("manager", true), NOW)).toEqual({ type: "redirect", to: "/change-password" });
      expect(resolveRouteAccess("/profileX", null, NOW)).toEqual({ type: "allow", noStore: false });
    });
  });
});
