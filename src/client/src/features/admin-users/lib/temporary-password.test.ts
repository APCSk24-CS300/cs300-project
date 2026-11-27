import { describe, expect, it } from "vitest";
import { generateTemporaryPassword, initialsOf } from "@/features/admin-users/lib/temporary-password";

const digits = (value: string) => (n: number) => value.slice(0, n);

describe("generateTemporaryPassword (FR-036)", () => {
  it("student: KHTN@ + initials + last 4 student-number digits", () => {
    expect(generateTemporaryPassword({ fullName: "Nguyễn Văn An", role: "student", studentNumber: "23127001" })).toBe(
      "KHTN@NVA7001",
    );
  });

  it("staff: KHTN@ + initials + 4 random digits", () => {
    expect(generateTemporaryPassword({ fullName: "Trần Thị Bích", role: "manager" }, digits("8203"))).toBe("KHTN@TTB8203");
    expect(generateTemporaryPassword({ fullName: "Lê Quốc Huy", role: "administrator" }, digits("0451"))).toBe(
      "KHTN@LQH0451",
    );
  });

  it("maps Đ/đ to D and removes diacritics", () => {
    expect(initialsOf("Đặng Thu Mai")).toBe("DTM");
    expect(initialsOf("đỗ ánh")).toBe("DA");
  });

  it("ignores extra spaces and hyphens; one word gives one initial", () => {
    expect(initialsOf("  Nguyễn   Văn-An ")).toBe("NVA");
    expect(generateTemporaryPassword({ fullName: "Madonna", role: "student", studentNumber: "12345678" })).toBe(
      "KHTN@M5678",
    );
  });

  it("left-pads a short student number with random digits", () => {
    expect(generateTemporaryPassword({ fullName: "Nguyễn Văn An", role: "student", studentNumber: "12" }, digits("98"))).toBe(
      "KHTN@NVA9812",
    );
  });

  it("is always at least 10 characters", () => {
    for (const name of ["A", "Nguyễn Văn An", "X Y"]) {
      for (const role of ["student", "manager", "administrator"] as const) {
        expect(generateTemporaryPassword({ fullName: name, role, studentNumber: "1" }).length).toBeGreaterThanOrEqual(10);
      }
    }
  });
});
