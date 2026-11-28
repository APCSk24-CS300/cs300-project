/**
 * The single phone-number rule of the client (plan 006 O6, approved Q4; docs-changes DOC-07).
 *
 * Source: dev's openapi.yaml `UpdateProfileRequest.phoneNumber.pattern` (domestic `0` + 9 digits, or
 * `+84` + 9 digits), the same as the profile BE. An empty value means "no phone number" (null).
 *
 * Used by the profile phone form and by admin account creation (UC-29). For admin create the contract
 * defines no pattern yet, so only the FE and the MSW mock enforce it there (DOC-07).
 */
export const PHONE_PATTERN = /^(?:0\d{9}|\+84\d{9})$/;

export const PHONE_INVALID = "Enter 0 followed by 9 digits, or +84 followed by 9 digits.";

/** True for an empty value (no phone) or a value that matches the pattern; the value is trimmed first. */
export function isValidPhoneNumber(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || PHONE_PATTERN.test(trimmed);
}

/** The API value: the trimmed number, or null when empty. */
export function toPhoneNumberValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
