import { z } from "zod";

/** Sign-in input (FR-001, FR-002). No role field: the role comes from the account. */
export const LoginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Password is required"),
});

export type LoginSchemaType = z.infer<typeof LoginSchema>;
