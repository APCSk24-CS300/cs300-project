import { describe, expect, it } from "vitest";
import { getPasswordChangeError } from "./password.validation";

// The FE minimum is 8 code points (plan 006 Q3, DOC-23); dev's original table used 6.
describe("password change validation", () => {
  it.each([
    ["", "12345678", "12345678", "Enter your current password."],
    ["old", "1234567", "1234567", "Your new password must be at least 8 characters."],
    ["old", "12345678", "different", "The new password and confirmation do not match."],
    ["old", "12345678", "12345678", null],
    ["old", "😀😀😀😀😀😀😀", "😀😀😀😀😀😀😀", "Your new password must be at least 8 characters."],
    ["old", "😀😀😀😀😀😀😀😀", "😀😀😀😀😀😀😀😀", null],
  ])("validates current password, Unicode length, and confirmation", (currentPassword, newPassword, confirmPassword, expected) => {
    expect(getPasswordChangeError({ currentPassword, newPassword, confirmPassword })).toBe(expected);
  });
});
