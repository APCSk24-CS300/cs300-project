"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/hooks/useAuth";
import { isApiError } from "@/libs/api-client";
import { toUserMessage } from "@/libs/error-messages";
import { getDashboardPath, isPathAllowedForRole } from "@/libs/navigation";
import { ChangePasswordSchema, type ChangePasswordValues } from "@/features/auth/schema/change-password.schema";

/** "Set a new password" at first sign-in (US7, FR-045–FR-048). react-hook-form + zodResolver. */
export function ChangePasswordForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const { changePassword, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (error) alertRef.current?.focus();
  }, [error]);

  async function submit({ currentPassword, newPassword }: ChangePasswordValues) {
    setError(null);
    try {
      const user = await changePassword({ currentPassword, newPassword });
      router.replace(redirectTo && isPathAllowedForRole(redirectTo, user.role) ? redirectTo : getDashboardPath(user.role));
    } catch (err) {
      if (isApiError(err) && err.code === "CURRENT_PASSWORD_INCORRECT") {
        form.setError("currentPassword", { message: "Current password is incorrect" });
      } else if (isApiError(err) && err.fieldErrors.newPassword) {
        form.setError("newPassword", { message: err.fieldErrors.newPassword });
      }
      setError(toUserMessage(err, "changePassword"));
      submitting.current = false;
    }
  }

  return (
    <div className="max-w-xl rounded-2xl border border-divider bg-surface p-6 shadow-xs sm:p-8">
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          // Double-submit guard (FR-048).
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
        <Alert variant="info">For your security, set a new password before continuing.</Alert>
        <FormField label="Current (temporary) password" required error={errors.currentPassword?.message}>
          <PasswordInput autoComplete="current-password" {...form.register("currentPassword")} />
        </FormField>
        <FormField label="New password" required hint="At least 8 characters." error={errors.newPassword?.message}>
          <PasswordInput autoComplete="new-password" {...form.register("newPassword")} />
        </FormField>
        <FormField label="Confirm new password" required error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...form.register("confirmPassword")} />
        </FormField>
        {error ? (
          <Alert ref={alertRef} variant="error">
            {error}
          </Alert>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3 border-t border-divider pt-5">
          <Button variant="ghost" onClick={() => void logout()} disabled={isSubmitting}>
            Log out
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Set a new password
          </Button>
        </div>
      </form>
    </div>
  );
}
