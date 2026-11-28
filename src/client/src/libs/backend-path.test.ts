import { describe, expect, it } from "vitest";
import { isAllowedBackendPath, isAuthPath } from "@/libs/backend-path";

describe("isAllowedBackendPath", () => {
  it("allows exactly the operations the client calls", () => {
    for (const p of [
      "hub/services", "hub/services/3", "admin/services", "admin/services/3",
      "auth/login", "auth/logout", "auth/me", "profile/password",
      "admin/users", "admin/users/7", "admin/faculties", "admin/roles", "admin/roles/r1/permissions",
      "activities/landing", "profile", "profile/avatar",
      "profile/avatar/files/4f1c2a3b-0000-4000-8000-123456789abc.png", "profile/avatar/files/a.jpg",
    ]) {
      expect(isAllowedBackendPath(p), p).toBe(true);
    }
  });

  it("blocks everything else", () => {
    for (const p of [
      "", "hub", "admin", "admin/servicesX", "ai/chat", "auth/register", "auth", "profilex", "profile/avatars",
      "hub/../admin/users", "hub//x", "hub/%2e%2e/x", "admin/users/../../ai/chat", "health",
    ]) {
      expect(isAllowedBackendPath(p), p).toBe(false);
    }
  });

  it("recognises sign-in and session paths", () => {
    expect(isAuthPath("auth/login")).toBe(true);
    expect(isAuthPath("auth/me")).toBe(true);
    expect(isAuthPath("hub/services")).toBe(false);
  });

  it("allows one safe avatar file name only (plan 006 step 7)", () => {
    for (const p of [
      "profile/avatar/files", "profile/avatar/files/", "profile/avatar/files/a/b.png", "profile/avatar/files/..",
      "profile/avatar/files/%2e%2e", "profile/avatar/files/a%2Fb.png", "profile/avatar/files/.png",
    ]) {
      expect(isAllowedBackendPath(p), p).toBe(false);
    }
  });
});
