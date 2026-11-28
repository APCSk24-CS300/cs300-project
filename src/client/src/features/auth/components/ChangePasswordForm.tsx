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
import {
  createChangePasswordSchema,
  type ChangePasswordValues,
  type ChangePasswordVariant,
} from "@/features/auth/schema/change-password.schema";
import { PASSWORD_HINT } from "@/libs/validation/password";

type ChangePasswordFormProps = {
  /**
   * "first-sign-in": 003 US7 "Set a new password" (FR-045–FR-048), goes on to the dashboard.
   * "profile": UC-03 A2 on My profile; stays on the page and confirms (plan 006 O3, approved Q2).
   */
  variant?: ChangePasswordVariant;
  redirectTo?: string;
};

const EMPTY: ChangePasswordValues = { currentPassword: "", newPassword: "", confirmPassword: "" };

/**
 * The single change-password form (react-hook-form + zodResolver). Both variants use the same service
 * path (`AuthProvider.changePassword` → `PATCH /profile/password`) and the same rule (DOC-23).
 * A wrong current password (400 CURRENT_PASSWORD_INCORRECT, API-GAP-007) goes on its field; the new
 * password is kept so it can be corrected.
 */
export function ChangePasswordForm({ variant = "first-sign-in", redirectTo }: ChangePasswordFormProps) {
  const router = useRouter();
  const { changePassword, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(createChangePasswordSchema(variant)),
    defaultValues: EMPTY,
  });
  const profile = variant === "profile";
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (error) alertRef.current?.focus();
  }, [error]);

  async function submit({ currentPassword, newPassword }: ChangePasswordValues) {
    setError(null);
    setDone(false);
    try {
      const user = await changePassword({ currentPassword, newPassword });
      if (profile) {
        form.reset(EMPTY);
        setDone(true);
        submitting.current = false;
        return;
      }
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

  const body = (
      <form
        noValidate
        aria-label={profile ? "Change password" : undefined}
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
        {profile ? null : (
          <Alert variant="info" className="text-[15px]">
            For your security, set a new password before continuing.
          </Alert>
        )}
        <FormField
          label={profile ? "Current password" : "Current (temporary) password"}
          size="comfortable"
          required
          error={errors.currentPassword?.message}
        >
          <PasswordInput autoComplete="current-password" {...form.register("currentPassword")} />
        </FormField>
        <FormField label="New password" size="comfortable" required hint={PASSWORD_HINT} error={errors.newPassword?.message}>
          <PasswordInput autoComplete="new-password" {...form.register("newPassword")} />
        </FormField>
        <FormField label="Confirm new password" size="comfortable" required error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...form.register("confirmPassword")} />
        </FormField>
        {error ? (
          <Alert ref={alertRef} variant="error">
            {error}
          </Alert>
        ) : null}
        {done ? <Alert variant="success">Password changed successfully.</Alert> : null}
        <div className="flex flex-wrap justify-end gap-3 border-t border-divider pt-5">
          {profile ? null : (
            <Button variant="ghost" onClick={() => void logout()} disabled={isSubmitting}>
              Log out
            </Button>
          )}
          <Button type="submit" isLoading={isSubmitting}>
            {profile ? "Change password" : "Set a new password"}
          </Button>
        </div>
      </form>
  );

  if (profile) return body;

  return <div className="max-w-xl rounded-2xl border border-divider bg-surface p-6 shadow-xs sm:p-8">{body}</div>;
}
