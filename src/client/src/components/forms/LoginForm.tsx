
"use client";

import { SubmitEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import type { LoginSchemaType } from "@/schemas/login.schema";
import { LoginSchema } from "@/schemas/login.schema";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

function LoginForm() {
    const router = useRouter();
    const authContext = useAuth();
    const form = useForm<LoginSchemaType>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            role: 'student' ,
            email: '',
            password: '',
        },
    })
    
    const role = useWatch({
        control: form.control,
        name: 'role',
        defaultValue: 'student',
    })

    const email = useWatch({
        control: form.control,
        name: 'email',
        defaultValue: '',
    });

    const password = useWatch({
        control: form.control,
        name: 'password',
        defaultValue: '',
    });
    const isDisabled = !email || !password ;

    const onSubmit: SubmitHandler<LoginSchemaType> = async (data) => {
        try {
            await authContext.login(data.role, data.email, data.password);

            if (authContext.isAuthenticated) {
                const user_role = authContext.user?.role;
                if(user_role){
                    console.log(`User is authenticated, redirecting to ${user_role}/dashboard...`)
                    router.push(`/${user_role}/dashboard`);
                }
                else {
                    console.error("User role is undefined");
                    alert("Login failed. User role is undefined.");
                }
            }
        }
        catch (error) {
            // Placeholder for later error handling
            console.error("Login failed", error);
            alert("Login failed. Please check your credentials and try again.");
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <select {...form.register("role")}>
                <option value="student">Student</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
            </select>
            <hr />
            <p>Selected role: {role}</p>
            <hr />
            <input type="email"   {...form.register("email")} placeholder="Enter your email"  />
            {form.formState.errors.email && (
                <p>{form.formState.errors.email.message}</p>
            )}

            <hr />
            <input type="password"  {...form.register("password")} placeholder="Enter your password"  />
            {form.formState.errors.password && (
                <p>{form.formState.errors.password.message}</p>
            )}
            <hr />
            <button type="submit" disabled={isDisabled}>
                {form.formState.isSubmitting ? "Logging in..." : "Button Login"}
            </button>
        </form>
    );
}

export default LoginForm;   
