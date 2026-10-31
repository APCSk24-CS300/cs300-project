
"use client";

import { SubmitEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";


 function LoginForm() {
    const router = useRouter();

    // take user input
    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const authContext = useAuth();

        const formData = new FormData(event.target);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            await authContext.login(email, password);

            if (authContext.isAuthenticated) {
                console.log('User is authenticated, redirecting to {role}/dashboard...')
                router.push('/{role}/dashboard');
            }
        }
        catch (error) {
            // Placeholder for later error handling
            console.error("Login failed", error);
            alert("Login failed. Please check your credentials and try again.");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input type="email" name="email" placeholder="Enter your email" required />
            <input type="password" name="password" placeholder="Enter your password" required />
            <button type="submit">Login</button>
        </form>
    );
}

export default LoginForm;   
