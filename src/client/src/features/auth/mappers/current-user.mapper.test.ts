import { describe, expect, it } from "vitest";
import { InvalidRoleError, toCurrentUser } from "@/features/auth/mappers/current-user.mapper";
import type { CurrentUserContextWithGaps } from "@/features/auth/types/auth.dto";

type Data = CurrentUserContextWithGaps["data"];

const base = (user: Partial<Data["user"]> = {}): Data => ({
  user: {
    id: "user-001",
    email: "student1@example.invalid",
    fullName: "Nguyễn Văn An",
    role: "student",
    status: "active",
    avatarUrl: null,
    academicInfo: {
      studentNumber: "23127001",
      faculty: { id: "120", code: "CIT", name: "Computer and Information Technology field" },
    },
    ...user,
  },
  permissions: ["registration.create"],
});

describe("toCurrentUser", () => {
  it("maps a valid context", () => {
    expect(toCurrentUser(base({ mustChangePassword: true }))).toEqual({
      id: "user-001",
      email: "student1@example.invalid",
      fullName: "Nguyễn Văn An",
      role: "student",
      status: "active",
      avatarUrl: null,
      studentNumber: "23127001",
      faculty: { id: "120", code: "CIT", name: "Computer and Information Technology field" },
      permissions: ["registration.create"],
      mustChangePassword: true,
    });
  });

  it("defaults mustChangePassword to false", () => {
    expect(toCurrentUser(base()).mustChangePassword).toBe(false);
  });

  it.each([null, undefined, "admin", "organizer"])("throws InvalidRoleError for role %s", (role) => {
    expect(() => toCurrentUser(base({ role: role as never }))).toThrow(InvalidRoleError);
  });
});
