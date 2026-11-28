import { describe, expect, it } from "vitest";
import { isAllowedBackendPath } from "@/libs/backend-path";

describe("isAllowedBackendPath", () => {
  it("allows hub and service administration paths", () => {
    for (const p of ["hub/services", "hub/services/3", "admin/services", "admin/services/3"]) {
      expect(isAllowedBackendPath(p), p).toBe(true);
    }
  });

  it("blocks everything else", () => {
    for (const p of ["", "hub", "admin", "admin/users", "admin/servicesX", "ai/chat", "auth/login", "hub/../admin/users", "hub//x", "hub/%2e%2e/x"]) {
      expect(isAllowedBackendPath(p), p).toBe(false);
    }
  });
});
