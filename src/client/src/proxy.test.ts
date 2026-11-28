import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";
import { SESSION_HINT_COOKIE, encodeHint } from "@/libs/session-hint";
import type { RoleCode } from "@/libs/roles";

const now = () => Math.floor(Date.now() / 1000);

function request(path: string, hint?: { role: RoleCode; mustChangePassword?: boolean; exp?: number }) {
  const req = new NextRequest(new URL(path, "http://localhost:3000"));
  if (hint) {
    req.cookies.set(
      SESSION_HINT_COOKIE,
      encodeHint({ role: hint.role, mustChangePassword: hint.mustChangePassword ?? false, exp: hint.exp ?? now() + 600 }),
    );
  }
  return req;
}

const location = (res: Response) => res.headers.get("location");

describe("proxy (route guard)", () => {
  it("sends a visitor without a hint to sign-in with a return path", () => {
    const res = proxy(request("/admin/users?page=2"));
    expect(location(res)).toBe("http://localhost:3000/login?redirectTo=%2Fadmin%2Fusers%3Fpage%3D2");
  });

  it("sends the wrong role to /forbidden", () => {
    expect(location(proxy(request("/admin/users", { role: "student" })))).toBe("http://localhost:3000/forbidden");
  });

  it("allows the own area and marks it no-store (UC-02 A4)", () => {
    const res = proxy(request("/student/dashboard", { role: "student" }));
    expect(location(res)).toBeNull();
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("treats an expired hint as no session", () => {
    expect(location(proxy(request("/student/dashboard", { role: "student", exp: now() - 5 })))).toMatch(/\/login\?redirectTo=/);
  });

  it("redirects /login with a valid hint to the dashboard (A7), and leaves it alone without one", () => {
    expect(location(proxy(request("/login", { role: "manager" })))).toBe("http://localhost:3000/manager/dashboard");
    expect(location(proxy(request("/login")))).toBeNull();
  });

  it("never reads a token cookie", () => {
    const req = request("/student/dashboard");
    req.cookies.set("myhcmus_token", "anything");
    expect(location(proxy(req))).toMatch(/\/login/);
  });
  describe("University Services Hub routes (plan 005 step 3)", () => {
    it("sends signed-out visitors from /services and /admin/services to sign-in with a return path", () => {
      expect(location(proxy(request("/services")))).toBe("http://localhost:3000/login?redirectTo=%2Fservices");
      expect(location(proxy(request("/admin/services")))).toBe(
        "http://localhost:3000/login?redirectTo=%2Fadmin%2Fservices",
      );
    });

    it("lets every signed-in role open /services, marked no-store", () => {
      for (const role of ["student", "manager", "administrator"] as const) {
        const res = proxy(request("/services", { role }));
        expect(location(res)).toBeNull();
        expect(res.headers.get("cache-control")).toContain("no-store");
      }
    });

    it("sends non-administrators on /admin/services to /forbidden and lets administrators in", () => {
      expect(location(proxy(request("/admin/services", { role: "student" })))).toBe("http://localhost:3000/forbidden");
      expect(location(proxy(request("/admin/services", { role: "manager" })))).toBe("http://localhost:3000/forbidden");
      expect(location(proxy(request("/admin/services", { role: "administrator" })))).toBeNull();
    });
  });
});
