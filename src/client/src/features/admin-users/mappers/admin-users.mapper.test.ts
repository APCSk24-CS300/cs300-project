import { describe, expect, it } from "vitest";
import {
  toAccountSummary,
  toCreateUserRequest,
  toFaculties,
  toFaculty,
  toRolePermissions,
} from "@/features/admin-users/mappers/admin-users.mapper";

describe("admin-users mappers", () => {
  it("maps AdminUser to AccountSummary", () => {
    expect(
      toAccountSummary({
        id: "user-001",
        email: "a@x.invalid",
        fullName: "A",
        status: "inactive",
        role: "student",
        studentNumber: "23127001",
        createdAt: "2026-09-01T08:00:00.000Z",
      }),
    ).toEqual({
      id: "user-001",
      email: "a@x.invalid",
      fullName: "A",
      status: "inactive",
      role: "student",
      studentNumber: "23127001",
      createdAt: new Date("2026-09-01T08:00:00.000Z"),
    });
  });

  it("builds the create request: drops student fields for staff, '' → null, trims phone, sets initialPassword", () => {
    const draft = {
      email: " M@X.invalid ",
      fullName: " Trần ",
      role: "manager" as const,
      phoneNumber: "  ",
      studentNumber: "123",
      facultyId: "120",
      temporaryPassword: "KHTN@T1234",
      passwordOverridden: false,
    };
    expect(toCreateUserRequest(draft)).toEqual({
      email: "m@x.invalid",
      fullName: "Trần",
      role: "manager",
      studentNumber: null,
      facultyId: null,
      phoneNumber: null,
      initialPassword: "KHTN@T1234",
    });
    expect(toCreateUserRequest({ ...draft, role: "student", phoneNumber: " 090 " })).toMatchObject({
      studentNumber: "123",
      facultyId: "120",
      phoneNumber: "090",
    });
  });

  it("maps faculties to the domain type (C3): drops incomplete items, sorts by name", () => {
    expect(toFaculty({ id: "1" })).toBeNull();
    expect(toFaculty({ id: "1", name: "Bio" })).toEqual({ id: "1", code: "", name: "Bio" });
    expect(toFaculties([{ id: "2", name: "Chemistry", code: "C" }, { name: "x" }, { id: "1", name: "Biology", code: "B" }]).map((f) => f.name)).toEqual([
      "Biology",
      "Chemistry",
    ]);
  });

  it("maps role permissions", () => {
    expect(
      toRolePermissions("student", { permissions: [{ code: "registration.create", description: "Register" }, { description: "x" }] }),
    ).toEqual({ role: "student", permissions: [{ code: "registration.create", description: "Register" }] });
  });
});
