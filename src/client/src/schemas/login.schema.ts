import { ROLE_CODES } from '@/libs/roles';
import { email, z } from 'zod'

export const LoginSchema = z.object({
        role: z.enum(ROLE_CODES, "Invalid role"),
        email: z.email("Invalid email address").min(1, "Email is required"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
});

export type LoginSchemaType = z.infer<typeof LoginSchema>;
