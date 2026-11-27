import { z } from "zod";
import { ROLE_CODES } from "@/libs/roles";
import { TEMP_PASSWORD_MIN_LENGTH } from "@/features/admin-users/lib/temporary-password";

/**
 * data-model §2.6. Phone is only trimmed: no format is defined anywhere (GAP-P / DOC-07).
 * `AccountFieldsSchema` validates the form step; `NewAccountSchema` the full draft incl. the
 * temporary password (review step).
 */
const fields = {
  email: z.string().trim().toLowerCase().min(1, "Email is required").pipe(z.email("Enter a valid email address")),
  fullName: z.string().trim().min(1, "Full name is required").max(100, "Use at most 100 characters"),
  role: z.enum(ROLE_CODES, "Each account has exactly one role"),
  phoneNumber: z.string().trim(),
  studentNumber: z.string().trim(),
  facultyId: z.string(),
};

type StudentFields = { role: string; studentNumber: string; facultyId: string };

function studentRule(value: StudentFields, ctx: z.RefinementCtx) {
  if (value.role !== "student") {
    return;
  }
  if (!value.studentNumber) {
    ctx.addIssue({ code: "custom", path: ["studentNumber"], message: "Student number is required" });
  } else if (value.studentNumber.length > 20) {
    ctx.addIssue({ code: "custom", path: ["studentNumber"], message: "Use at most 20 characters" });
  }
  if (!value.facultyId) {
    ctx.addIssue({ code: "custom", path: ["facultyId"], message: "Choose a faculty" });
  }
}

export const AccountFieldsSchema = z.object(fields).superRefine(studentRule);

export const TemporaryPasswordSchema = z.string().min(TEMP_PASSWORD_MIN_LENGTH, "Use at least 8 characters");

export const NewAccountSchema = z
  .object({ ...fields, temporaryPassword: TemporaryPasswordSchema, passwordOverridden: z.boolean() })
  .superRefine(studentRule);

export type AccountFieldsInput = z.input<typeof AccountFieldsSchema>;
export type AccountFields = z.output<typeof AccountFieldsSchema>;
