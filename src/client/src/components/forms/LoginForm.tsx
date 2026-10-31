
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
        resolver: zodResolver(LoginSchema)
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
            await authContext.login(data.email, data.password);

            if (authContext.isAuthenticated) {
                console.log('User is authenticated, redirecting to {role}/dashboard...')
                // router.push('/{role}/dashboard');
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
