
"use client";

import { SubmitEvent, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import type { LoginSchemaType } from "@/schemas/login.schema";
import { LoginSchema } from "@/schemas/login.schema";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserIcon } from "../icons/UserIcon";
import { UsersIcon } from "../icons/UsersIcon";
import { LoginRequest } from "@/types/dtos/auth.dto";



const ROLE_OPTIONS = [
    {
        value: "student",
        label: "Student",
        icon: "user",
    },
    {
        value: "organizer",
        label: "Organizer",
        icon: "users",
    },
] as const;




function LoginForm() {
    const router = useRouter();
    const authContext = useAuth();
    const [loginError, setLoginError] = useState<string | null>(null);

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
    const isDisabled = !email || !password || form.formState.isSubmitting;

    // useEffect(() => {
    //     if (authContext.isAuthenticated && authContext.user?.role) {
    //         router.replace(`/${authContext.user.role}/dashboard`);
    //     }
    // }, [
    //     authContext.isAuthenticated,
    //     authContext.user?.role,
    //     router,
    // ]);

    const onSubmit: SubmitHandler<LoginSchemaType> = async (data: LoginRequest) => {
        setLoginError(null); 

        try {
            const user = await authContext.login(data);

            if (user) {
                const user_role = user.role;
                router.push(`/${user_role}/dashboard`);
            }
            else {
                setLoginError("Login failed. Please check your credentials.");
            }
        }
        catch (error) {
            // Placeholder for later error handling
            console.error("Login failed", error);
            setLoginError(
                error instanceof Error
                    ? error.message
                    : "Login failed. Please check your credentials."
            );        }
    }

    return (
         <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full"
        >
            {/* Role selection */}
            <div className="mb-5">
                <p className="mb-3 text-xl font-medium text-[#10132f]">
                    Select user type
                </p>

                <div className="grid grid-cols-2 gap-5">
                    {ROLE_OPTIONS.map((option) => {
                        const isSelected = role === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => {
                                    form.setValue("role", option.value, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                    });
                                }}
                                className={`
                                    flex h-[53px] items-center justify-center
                                    gap-3 rounded-lg border-2 px-3
                                    text-xl font-semibold transition-colors
                                    ${
                                        isSelected
                                            ? "border-[#1b4da5] text-[#1b4da5]"
                                            : "border-[#b5b5b5] text-[#aaa] hover:border-[#1b4da5] hover:text-[#1b4da5]"
                                    }
                                `}
                            >
                                {option.icon === "user"
                                    ? <UserIcon />
                                    : <UsersIcon />
                                }

                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Email */}
            <div className="mb-5">
                <label
                    htmlFor="email"
                    className="mb-2 block text-xl text-[#10132f]"
                >
                    Email address
                </label>

                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email..."
                    {...form.register("email")}
                    className="
                        h-[58px] w-full rounded-2xl border-2
                        border-[#b5b5b5] bg-white px-5
                        text-base text-[#10132f]
                        outline-none transition-colors
                        placeholder:text-[#aaa]
                        focus:border-[#1b4da5]
                    "
                />

                {form.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.email.message}
                    </p>
                )}
            </div>

            {/* Password */}
            <div className="mb-3">
                <label
                    htmlFor="password"
                    className="mb-2 block text-xl text-[#10132f]"
                >
                    Password
                </label>

                <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password..."
                    {...form.register("password")}
                    className="
                        h-[58px] w-full rounded-2xl border-2
                        border-[#b5b5b5] bg-white px-5
                        text-base text-[#10132f]
                        outline-none transition-colors
                        placeholder:text-[#aaa]
                        focus:border-[#1b4da5]
                    "
                />

                {form.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.password.message}
                    </p>
                )}
            </div>

            {/* Forgot password */}
            <div className="mb-2 text-right">
                <a
                    href="/forgot-password"
                    className="text-base text-[#929292] hover:text-[#1b4da5]"
                >
                    Forgot Password?
                </a>
            </div>

            {/* Login error */}
            {loginError && (
                <p
                    role="alert"
                    className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600"
                >
                    {loginError}
                </p>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={isDisabled}
                className="
                    h-[53px] w-full rounded-2xl
                    bg-[#1b4da5] text-xl font-medium text-white
                    shadow-md transition-colors
                    hover:bg-[#153e89]
                    active:scale-[0.99]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                "
            >
                {form.formState.isSubmitting
                    ? "Logging in..."
                    : "Log In"
                }
            </button>

            {/* Social login placeholder */}
            <div className="mt-7 border-t border-[#d5d5d5] pt-6">
                <p className="text-center text-sm text-[#999]">
                    Other sign-in methods
                </p>
                <div className="mt-4 flex justify-center gap-6">
                    <button
                        type="button"
                        disabled
                        aria-label="Google sign-in coming soon"
                        className="cursor-not-allowed opacity-40"
                    >
                        <span className="text-3xl font-bold text-[#4285F4]">
                            G
                        </span>
                    </button>

                    <button
                        type="button"
                        disabled
                        aria-label="Microsoft sign-in coming soon"
                        className="cursor-not-allowed"
                    >
                        <span className="grid h-7 w-7 grid-cols-2 gap-[2px]">
                            <span className="bg-[#f25022]" />
                            <span className="bg-[#7fba00]" />
                            <span className="bg-[#00a4ef]" />
                            <span className="bg-[#ffb900]" />
                        </span>
                    </button>
                </div>
            </div>
        </form>
    );
}
export default LoginForm;   
