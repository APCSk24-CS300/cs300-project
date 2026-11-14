import { describe, expect, it } from "vitest";
import {
  getDashboardPath,
  getLoginHref,
  isSafeRedirectPath,
} from "./navigation";

describe("navigation helpers", () => {
  it("resolves a dashboard path for every role", () => {
    expect(getDashboardPath("student")).toBe("/student/dashboard");
    expect(getDashboardPath("manager")).toBe("/manager/dashboard");
    expect(getDashboardPath("admin")).toBe("/admin/dashboard");
    expect(getDashboardPath(null)).toBe("/login");
  });

  it("encodes a valid landing return path", () => {
    expect(getLoginHref("/#services")).toBe(
      "/login?redirectTo=%2F%23services",
    );
    expect(getLoginHref()).toBe("/login");
  });

  it("accepts safe same-origin landing paths", () => {
    expect(isSafeRedirectPath("/")).toBe(true);
    expect(isSafeRedirectPath("/#services")).toBe(true);
    expect(isSafeRedirectPath("/activities/abc?tab=details")).toBe(true);
  });

  it("rejects unsafe redirect targets", () => {
    expect(isSafeRedirectPath("https://evil.example")).toBe(false);
    expect(isSafeRedirectPath("//evil.example")).toBe(false);
    expect(isSafeRedirectPath("/\\evil.example")).toBe(false);
    expect(isSafeRedirectPath("/\nservices")).toBe(false);
    expect(isSafeRedirectPath("/login")).toBe(false);
    expect(isSafeRedirectPath("/login?redirectTo=%2Fservices")).toBe(false);
    expect(isSafeRedirectPath("services")).toBe(false);
  });
});
