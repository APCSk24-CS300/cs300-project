"use client";

import { useState, type FormEvent } from "react";
import { authService } from "@/features/auth/services/auth.service";

const MIN_PASSWORD_LENGTH = 8;

export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearPasswords = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError("Enter your current password.");
      clearPasswords();
      return;
    }

    if (Array.from(newPassword).length < MIN_PASSWORD_LENGTH) {
      setError("Your new password must be at least 8 characters.");
      clearPasswords();
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new password and confirmation do not match.");
      clearPasswords();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      if (!response.success) {
        setError(response.message || "Password could not be changed. Please try again.");
        return;
      }

      setSuccess(response.message || "Password changed successfully.");
    } catch {
      setError("Password could not be changed. Check your current password and try again.");
    } finally {
      clearPasswords();
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="password-change-heading"
      className="mt-8 border-t border-slate-200 pt-8"
    >
      <h2 id="password-change-heading" className="text-lg font-semibold text-text">
        Change password
      </h2>
      <form className="mt-4 grid max-w-xl gap-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label
            htmlFor="current-password"
            className="text-sm font-medium text-text-muted"
          >
            Current password
          </label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            disabled={isSubmitting}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
          />
        </div>
        <div>
          <label
            htmlFor="new-password"
            className="text-sm font-medium text-text-muted"
          >
            New password
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            disabled={isSubmitting}
            aria-describedby="new-password-hint"
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
          />
          <p id="new-password-hint" className="mt-2 text-sm text-text-muted">
            Use at least 8 characters.
          </p>
        </div>
        <div>
          <label
            htmlFor="confirm-new-password"
            className="text-sm font-medium text-text-muted"
          >
            Confirm new password
          </label>
          <input
            id="confirm-new-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            disabled={isSubmitting}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-sm font-medium text-green-700" role="status">
            {success}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-pill bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Changing password…" : "Change password"}
        </button>
      </form>
    </section>
  );
}
