import { describe, expect, it } from "vitest";
import { isAllowedBackendPath } from "@/libs/backend-path";
import { fromBackendRole, toBackendRole } from "@/libs/roles";

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

describe("role mapping", () => {
  it("maps admin to administrator and back", () => {
    expect(toBackendRole("admin")).toBe("administrator");
    expect(toBackendRole("student")).toBe("student");
    expect(fromBackendRole("administrator")).toBe("admin");
    expect(fromBackendRole("manager")).toBe("manager");
    expect(fromBackendRole("root")).toBeNull();
  });
});
