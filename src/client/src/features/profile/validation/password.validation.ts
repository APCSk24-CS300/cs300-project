interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Confirmation stays in the client; count Unicode characters like the server. */
export function getPasswordChangeError({
  currentPassword,
  newPassword,
  confirmPassword,
}: PasswordChangeInput): string | null {
  if (!currentPassword) return "Enter your current password.";
  if (Array.from(newPassword).length < 6) {
    return "Your new password must be at least 6 characters.";
  }
  if (newPassword !== confirmPassword) {
    return "The new password and confirmation do not match.";
  }
  return null;
}
