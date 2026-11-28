import { describe, expect, it } from "vitest";
import { AccountFieldsSchema, NewAccountSchema } from "@/features/admin-users/schema/new-account.schema";

const valid = {
  email: "  An.Nguyen@Example.invalid ",
  fullName: " Nguyễn Văn An ",
  role: "student" as const,
  phoneNumber: " 0901234567 ",
  studentNumber: "23127555",
  facultyId: "120",
};

const issues = (input: unknown) => {
  const result = AccountFieldsSchema.safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
};

describe("account fields schema (data-model §2.6)", () => {
  it("trims and lowercases the email, trims name and phone", () => {
    const parsed = AccountFieldsSchema.parse(valid);
    expect(parsed.email).toBe("an.nguyen@example.invalid");
    expect(parsed.fullName).toBe("Nguyễn Văn An");
    expect(parsed.phoneNumber).toBe("0901234567");
  });

  it("requires a valid email and a 1–100 character name", () => {
    expect(issues({ ...valid, email: "" }).email).toBe("Email is required");
    expect(issues({ ...valid, email: "nope" }).email).toBe("Enter a valid email address");
    expect(issues({ ...valid, fullName: "   " }).fullName).toBe("Full name is required");
    expect(issues({ ...valid, fullName: "x".repeat(101) }).fullName).toBe("Use at most 100 characters");
  });

  it("requires student number (≤ 20) and faculty only for students", () => {
    expect(issues({ ...valid, studentNumber: "" }).studentNumber).toBe("Student number is required");
    expect(issues({ ...valid, studentNumber: "1".repeat(21) }).studentNumber).toBe("Use at most 20 characters");
    expect(issues({ ...valid, facultyId: "" }).facultyId).toBe("Choose a faculty");
    expect(issues({ ...valid, role: "manager", studentNumber: "", facultyId: "" })).toEqual({});
  });

  it("rejects anything but exactly one role", () => {
    expect(issues({ ...valid, role: ["student", "manager"] }).role).toBe("Each account has exactly one role");
    expect(issues({ ...valid, role: "admin" }).role).toBe("Each account has exactly one role");
  });

  it("requires a temporary password of at least 8 characters", () => {
    expect(NewAccountSchema.safeParse({ ...valid, temporaryPassword: "short", passwordOverridden: true }).success).toBe(false);
    expect(NewAccountSchema.safeParse({ ...valid, temporaryPassword: "KHTN@NVA7555", passwordOverridden: false }).success).toBe(true);
  });
  it("uses the shared phone rule: empty, 0 + 9 digits or +84 + 9 digits (plan 006 Q4, DOC-07)", () => {
    for (const phoneNumber of ["", "  ", "0901234567", "+84901234567"]) {
      expect(AccountFieldsSchema.safeParse({ ...valid, phoneNumber }).success, phoneNumber).toBe(true);
    }
    for (const phoneNumber of ["abc 123", "090123456", "84901234567", "+8490123456", "0901 234 567"]) {
      expect(issues({ ...valid, phoneNumber }), phoneNumber).toEqual(
        expect.objectContaining({ phoneNumber: expect.stringContaining("0 followed by 9 digits") }),
      );
    }
  });
});
