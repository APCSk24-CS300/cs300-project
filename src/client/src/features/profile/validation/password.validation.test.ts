import { describe, expect, it } from "vitest";
import { getPasswordChangeError } from "./password.validation";

describe("password change validation", () => {
  it.each([
    ["", "12345678", "12345678", "Enter your current password."],
    ["old", "12345", "12345", "Your new password must be at least 6 characters."],
    ["old", "123456", "different", "The new password and confirmation do not match."],
    ["old", "123456", "123456", null],
    ["old", "😀😀😀😀😀", "😀😀😀😀😀", "Your new password must be at least 6 characters."],
    ["old", "😀😀😀😀😀😀", "😀😀😀😀😀😀", null],
  ])("validates current password, Unicode length, and confirmation", (currentPassword, newPassword, confirmPassword, expected) => {
    expect(getPasswordChangeError({ currentPassword, newPassword, confirmPassword })).toBe(expected);
  });
});
