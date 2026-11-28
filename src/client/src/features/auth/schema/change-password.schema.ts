import { z } from "zod";
import { PASSWORD_TOO_SHORT, isLongEnoughPassword } from "@/libs/validation/password";

/** "Set a new password" (FR-045, data-model §2.9) and profile password change (UC-03 A2/A7).
 * The minimum comes from the shared rule (8 code points; DOC-23). */
export const ChangePasswordSchema = z
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
        message: "Choose a password different from the temporary one",
      });
    }
    if (value.confirmPassword && value.confirmPassword !== value.newPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
    }
  });

export type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>;
