import { z } from "zod";

/** "Set a new password" (FR-045, data-model §2.9). Min 8 satisfies NFR-SEC-02 (6) and the contract (8). */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
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
