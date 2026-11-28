import { z } from "zod";
import { PASSWORD_TOO_SHORT, isLongEnoughPassword } from "@/libs/validation/password";

export type ChangePasswordVariant = "first-sign-in" | "profile";

/**
 * "Set a new password" (FR-045, data-model §2.9) and the profile password change (UC-03 A2/A7): one
 * schema, one minimum (the shared rule, 8 code points; DOC-23). Confirmation is checked here and never
 * sent (ChangePasswordRequest has `additionalProperties: false`).
 */
export function createChangePasswordSchema(variant: ChangePasswordVariant = "first-sign-in") {
  return z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().refine(isLongEnoughPassword, PASSWORD_TOO_SHORT),
      confirmPassword: z.string().min(1, "Confirm the new password"),
    })
    .superRefine((value, ctx) => {
      if (value.newPassword && value.newPassword === value.currentPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["newPassword"],
          message:
            variant === "first-sign-in"
              ? "Choose a password different from the temporary one"
              : "Choose a password different from your current one",
        });
      }
      if (value.confirmPassword && value.confirmPassword !== value.newPassword) {
        ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
      }
    });
}

export const ChangePasswordSchema = createChangePasswordSchema("first-sign-in");

export type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>;
