import type { RoleCode } from "@/libs/roles";

/** FR-036b: minimum for a manually overridden temporary password. */
export const TEMP_PASSWORD_MIN_LENGTH = 8;
export const TEMP_PASSWORD_PREFIX = "KHTN@";

export type RandomDigits = (count: number) => string;

export function cryptoDigits(count: number): string {
  const bytes = new Uint8Array(count);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => String(b % 10)).join("");
}

/** "Nguyễn Văn An" → "NVA"; diacritics removed, Đ/đ → D, empty words ignored. */
export function initialsOf(fullName: string): string {
  return fullName
    .replace(/[Đđ]/g, "D")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[\s-]+/)
    .filter((word) => word.length > 0)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

/**
 * The ONE definition of the temporary-password rule (FR-036), so it can be made stricter later:
 * `KHTN@` + initials + suffix; suffix = last 4 student-number characters (left-padded with
 * random digits) for students, 4 random digits for staff.
 * Example: "Nguyễn Văn An" / 23127001 → KHTN@NVA7001.
 */
export function generateTemporaryPassword(
  input: { fullName: string; role: RoleCode; studentNumber?: string | null },
  random: RandomDigits = cryptoDigits,
): string {
  const initials = initialsOf(input.fullName) || "X";
  let suffix: string;
  if (input.role === "student") {
    const number = (input.studentNumber ?? "").trim();
    const tail = number.slice(-4);
    suffix = tail.length < 4 ? random(4 - tail.length) + tail : tail;
  } else {
    suffix = random(4);
  }
  return `${TEMP_PASSWORD_PREFIX}${initials}${suffix}`;
}
