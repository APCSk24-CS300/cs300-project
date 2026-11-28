import { describe, expect, it } from "vitest";
import { isAllowedBackendPath, isAuthPath } from "@/libs/backend-path";

describe("isAllowedBackendPath", () => {
  it("allows exactly the operations the client calls", () => {
    for (const p of [
      "hub/services", "hub/services/3", "admin/services", "admin/services/3",
      "auth/login", "auth/logout", "auth/me", "profile/password",
      "admin/users", "admin/users/7", "admin/faculties", "admin/roles", "admin/roles/r1/permissions",
      "activities/landing",
    ]) {
      expect(isAllowedBackendPath(p), p).toBe(true);
    }
  });

  it("blocks everything else", () => {
    for (const p of [
      "", "hub", "admin", "admin/servicesX", "ai/chat", "auth/register", "auth", "profile",
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
});
