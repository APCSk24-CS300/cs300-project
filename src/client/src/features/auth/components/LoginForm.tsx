"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { TextInput } from "@/components/ui/TextInput";
import { useAuth } from "@/hooks/useAuth";
import { isApiError } from "@/libs/api-client";
import { toUserMessage } from "@/libs/error-messages";
import { getDashboardPath, isPathAllowedForRole } from "@/libs/navigation";
import { CHANGE_PASSWORD_PATH } from "@/libs/route-access";
import { LoginSchema, type LoginSchemaType } from "@/features/auth/schema/login.schema";
import type { CurrentUser } from "@/features/auth/types/auth";

type LoginFormProps = {
  redirectTo?: string;
};

function destinationFor(user: CurrentUser, redirectTo?: string): string {
  if (user.mustChangePassword) {
    return redirectTo && isPathAllowedForRole(redirectTo, user.role)
      ? `${CHANGE_PASSWORD_PATH}?redirectTo=${encodeURIComponent(redirectTo)}`
      : CHANGE_PASSWORD_PATH;
  }
  return redirectTo && isPathAllowedForRole(redirectTo, user.role) ? redirectTo : getDashboardPath(user.role);
}

/** UC-01 sign-in form: email + password only (FR-001), all alternative flows A1–A7. */
export default function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const { login, status, user } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  // A7: already signed in -> own dashboard, without a new session.
  useEffect(() => {
    if ((status === "signedIn" || status === "mustChangePassword") && user && !submitting.current) {
      router.replace(destinationFor(user, redirectTo));
    }
  }, [status, user, redirectTo, router]);

  useEffect(() => {
    if (loginError) alertRef.current?.focus();
  }, [loginError]);

  async function submit({ email, password }: LoginSchemaType) {
    setLoginError(null);
    try {
      const signedIn = await login(email, password);
      router.replace(destinationFor(signedIn, redirectTo));
    } catch (error) {
      if (isApiError(error) && error.code === "VALIDATION_FAILED") {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field === "email" || field === "password") {
            form.setError(field, { message });
          }
        }
      }
      setLoginError(toUserMessage(error, "login"));
      form.setValue("password", "");
      submitting.current = false;
    }
  }

  return (
    <form
      noValidate
      className="flex w-full flex-col gap-5"
      onSubmit={(event) => {
        // Double-submit guard (FR-006 pending state): one request while one is in flight.
        if (submitting.current) {
          event.preventDefault();
          return;
        }
        void form.handleSubmit(async (values) => {
          submitting.current = true;
          await submit(values);
        })(event);
      }}
    >
      <FormField label="Email address" required error={errors.email?.message}>
        <TextInput
          type="email"
          autoComplete="email"
          placeholder="Enter your email..."
          {...form.register("email")}
        />
      </FormField>

      <FormField label="Password" required error={errors.password?.message}>
        <PasswordInput autoComplete="current-password" placeholder="Enter your password..." {...form.register("password")} />
      </FormField>

      {loginError ? (
        <Alert ref={alertRef} variant="error">
          {loginError}
        </Alert>
      ) : null}

      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full rounded-2xl">
        {isSubmitting ? "Logging in..." : "Log In"}
      </Button>
    </form>
  );
}
