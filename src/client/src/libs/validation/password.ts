/**
 * The single password rule of the client (plan 006 O6, approved Q3; docs-changes DOC-23, DOC-09).
 *
 * The FE enforces **8** characters, counted in Unicode code points like the backend counts them.
 * dev's openapi.yaml (`minLength: 6`), the BE (6), BR-ACC-09, NFR-SEC-02 and UC-03 A7 say 6. Being
 * stricter is compatible with the BE; DOC-23 asks the team to agree on one value.
 *
 * Used by both ChangePasswordForm variants (003 first sign-in, profile) and the MSW profile mock.
 * Admin-issued temporary passwords have their own rule (TEMP_PASSWORD_MIN_LENGTH, DOC-05).
 */
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters.`;
export const PASSWORD_TOO_SHORT = `Use at least ${PASSWORD_MIN_LENGTH} characters`;

/** Length in Unicode code points ("😀" counts once), as the backend counts it. */
export function codePointLength(value: string): number {
  return Array.from(value).length;
}

export function isLongEnoughPassword(value: string): boolean {
  return codePointLength(value) >= PASSWORD_MIN_LENGTH;
}
