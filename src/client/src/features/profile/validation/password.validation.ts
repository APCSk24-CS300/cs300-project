import { PASSWORD_MIN_LENGTH, isLongEnoughPassword } from "@/libs/validation/password";

interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Confirmation stays in the client. The minimum is the shared rule (8 code points; plan 006 Q3, DOC-23).
 * TODO(006 step 6): removed with dev's PasswordChangeForm (ChangePasswordForm variant="profile").
 */
export function getPasswordChangeError({
  currentPassword,
  newPassword,
  confirmPassword,
}: PasswordChangeInput): string | null {
  if (!currentPassword) return "Enter your current password.";
  if (!isLongEnoughPassword(newPassword)) {
    return `Your new password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (newPassword !== confirmPassword) {
    return "The new password and confirmation do not match.";
  }
  return null;
}
