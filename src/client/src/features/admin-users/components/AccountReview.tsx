"use client";

import { useState, type RefObject } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";
import { ROLE_LABEL } from "@/libs/roles";
import { TemporaryPasswordSchema, type AccountFields } from "@/features/admin-users/schema/new-account.schema";
import type { Faculty } from "@/features/admin-users/types/admin-users";
import { RolePermissionsPanel } from "@/features/admin-users/components/RolePermissionsPanel";

type AccountReviewProps = {
  fields: AccountFields;
  faculties: Faculty[];
  generatedPassword: string;
  override: string | null;
  onOverrideChange: (value: string | null) => void;
  error: string | null;
  errorRef: RefObject<HTMLDivElement | null>;
  submitting: boolean;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

/** UC-29 step 5: everything is shown before saving; nothing is saved yet (FR-032, FR-036a). */
export function AccountReview({
  fields,
  faculties,
  generatedPassword,
  override,
  onOverrideChange,
  error,
  errorRef,
  submitting,
  onBack,
  onCancel,
  onConfirm,
}: AccountReviewProps) {
  const [editing, setEditing] = useState(override !== null);
  const overrideCheck = override === null ? null : TemporaryPasswordSchema.safeParse(override);
  const overrideError = overrideCheck && !overrideCheck.success ? overrideCheck.error.issues[0]?.message : undefined;
  const isStudent = fields.role === "student";
  const facultyName = faculties.find((f) => f.id === fields.facultyId)?.name ?? "—";

  const rows: [string, string][] = [
    ["Email", fields.email],
    ["Full name", fields.fullName],
    ["Role", ROLE_LABEL[fields.role]],
    ["Phone number", fields.phoneNumber || "—"],
    ...(isStudent
      ? ([
          ["Student number", fields.studentNumber],
          ["Faculty", facultyName],
        ] as [string, string][])
      : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-muted">Review the new account. Nothing is saved until you confirm.</p>
      <dl className="grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-2">
        {rows.map(([term, value]) => (
          <div key={term}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">{term}</dt>
            <dd className="mt-0.5 break-words text-sm text-heading">{value}</dd>
          </div>
        ))}
      </dl>

      <RolePermissionsPanel role={fields.role} />

      <section aria-labelledby="temp-password-heading" className="rounded-2xl border border-border p-4">
        <h3 id="temp-password-heading" className="text-sm font-semibold text-heading">
          Temporary password
        </h3>
        <p className="mt-1 text-xs text-text-muted">
          The user must set a new password at first sign-in.
        </p>
        {editing ? (
          <div className="mt-3 flex flex-col gap-2">
            <FormField label="Temporary password" required error={overrideError} hint="At least 8 characters.">
              <TextInput
                autoComplete="off"
                value={override ?? ""}
                onChange={(e) => onOverrideChange(e.target.value)}
              />
            </FormField>
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onOverrideChange(null);
                  setEditing(false);
                }}
              >
                Use generated password
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code data-testid="generated-password" className="rounded-lg bg-hover-tint px-3 py-1.5 font-mono text-sm text-heading">
              {generatedPassword}
            </code>
            <Button
              variant="white"
              size="sm"
              onClick={() => {
                onOverrideChange(generatedPassword);
                setEditing(true);
              }}
            >
              Change
            </Button>
          </div>
        )}
      </section>

      {error ? (
        <Alert ref={errorRef} variant="error">
          {error}
        </Alert>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="white" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button onClick={onConfirm} isLoading={submitting} disabled={Boolean(overrideError)}>
          {error ? "Retry" : "Confirm"}
        </Button>
      </div>
    </div>
  );
}
