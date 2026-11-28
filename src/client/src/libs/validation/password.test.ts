import { describe, expect, it } from "vitest";
import {
  PASSWORD_HINT,
  PASSWORD_MIN_LENGTH,
  PASSWORD_TOO_SHORT,
  codePointLength,
  isLongEnoughPassword,
} from "@/libs/validation/password";

describe("shared password rule (plan 006 Q3, DOC-23)", () => {
  it("counts code points and requires 8 (DOC-23)", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(codePointLength("😀😀")).toBe(2);
    expect(isLongEnoughPassword("1234567")).toBe(false);
    expect(isLongEnoughPassword("12345678")).toBe(true);
    expect(isLongEnoughPassword("😀".repeat(7))).toBe(false); // 14 UTF-16 units, 7 characters
    expect(isLongEnoughPassword("😀".repeat(8))).toBe(true);
    expect(isLongEnoughPassword("")).toBe(false);
  });

  it("uses one copy for the hint and the error", () => {
    expect(PASSWORD_HINT).toBe("At least 8 characters.");
    expect(PASSWORD_TOO_SHORT).toBe("Use at least 8 characters");
  });
});
