import { describe, expect, it } from "vitest";
import { PHONE_PATTERN, isValidPhoneNumber, toPhoneNumberValue } from "@/libs/validation/phone";

describe("shared phone rule (plan 006 Q4, DOC-07)", () => {
  it("accepts empty, 0 + 9 digits and +84 + 9 digits; rejects everything else", () => {
    for (const ok of ["", "   ", "0901234567", "+84901234567", " 0901234567 "]) {
      expect(isValidPhoneNumber(ok), JSON.stringify(ok)).toBe(true);
    }
    for (const bad of ["090123456", "09012345678", "84901234567", "+8490123456", "+849012345678", "0901 234 567", "abc", "+840901234567"]) {
      expect(isValidPhoneNumber(bad), bad).toBe(false);
    }
  });

  it("matches the BE / contract pattern exactly and maps empty to null", () => {
    expect(PHONE_PATTERN.source).toBe("^(?:0\\d{9}|\\+84\\d{9})$");
    expect(toPhoneNumberValue("  ")).toBeNull();
    expect(toPhoneNumberValue(" 0901234567 ")).toBe("0901234567");
  });
});
