"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ForbiddenView } from "@/components/layout/ForbiddenView";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { useForbidden } from "@/hooks/useForbidden";
import { isApiError } from "@/libs/api-client";
import { toUserMessage } from "@/libs/error-messages";
import type { RoleCode } from "@/libs/roles";
import { useFaculties } from "@/features/admin-users/hooks/useFaculties";
import { useCreateAccount } from "@/features/admin-users/hooks/useCreateAccount";
import { cryptoDigits, generateTemporaryPassword } from "@/features/admin-users/lib/temporary-password";
import {
  AccountFieldsSchema,
  type AccountFields,
  type AccountFieldsInput,
} from "@/features/admin-users/schema/new-account.schema";
import type { CreatedAccount } from "@/features/admin-users/types/admin-users";
import { AccountForm } from "@/features/admin-users/components/AccountForm";
import { AccountResult } from "@/features/admin-users/components/AccountResult";
import { AccountReview } from "@/features/admin-users/components/AccountReview";

type Step = "form" | "review" | "result";

const DEFAULTS: AccountFieldsInput = {
  email: "",
  fullName: "",
  role: "student",
  phoneNumber: "",
  studentNumber: "",
  facultyId: "",
};

const FORM_FIELDS = new Set(["email", "fullName", "role", "phoneNumber", "studentNumber", "facultyId"]);

/** Random digits per role, fixed for one creation session (FR-036a). */
function newDigits(): Record<RoleCode, string> {
  return { student: cryptoDigits(4), manager: cryptoDigits(4), administrator: cryptoDigits(4) };
}

/** UC-29 subset: form → review → confirm → result, with A2/A6/A9/A11 (data-model §3.2). */
export function CreateAccountWizard() {
  const router = useRouter();
  const forbidden = useForbidden();
  const faculties = useFaculties();
  const { submit, pending } = useCreateAccount();
  const form = useForm<AccountFieldsInput, unknown, AccountFields>({
    resolver: zodResolver(AccountFieldsSchema),
    defaultValues: DEFAULTS,
  });
  const [step, setStep] = useState<Step>("form");
  const [fields, setFields] = useState<AccountFields | null>(null);
  const [override, setOverride] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedAccount | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  // Read during render so react-hook-form tracks it (its formState is a subscription proxy).
  const { isDirty } = form.formState;

  // Random digits stay the same within one creation session unless the role changes (FR-036a).
  const [digitsByRole, setDigitsByRole] = useState<Record<RoleCode, string>>(newDigits);

  const generatedPassword = useMemo(() => {
    if (!fields) return "";
    const digits = digitsByRole[fields.role];
    return generateTemporaryPassword(fields, (n) => digits.slice(0, n));
  }, [fields, digitsByRole]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  if (forbidden.isForbidden || faculties.status === "forbidden") {
    return <ForbiddenView dashboardHref="/admin/dashboard" />;
  }

  const leave = () => router.push("/admin/users");
  const requestCancel = () => {
    if (isDirty || step === "review") {
      setConfirmDiscard(true);
    } else {
      leave();
    }
  };

  const review = form.handleSubmit((values) => {
    const cleaned: AccountFields =
      values.role === "student" ? values : { ...values, studentNumber: "", facultyId: "" };
    setFields(cleaned);
    setError(null);
    setStep("review");
  });

  const confirm = async () => {
    if (!fields) return;
    const temporaryPassword = override ?? generatedPassword;
    setError(null);
    try {
      const account = await submit({
        ...fields,
        temporaryPassword,
        passwordOverridden: override !== null,
      });
      setCreated({ account, temporaryPassword });
      setStep("result");
    } catch (err) {
      if (forbidden.handleError(err)) return;
      const fieldErrors = isApiError(err) ? Object.entries(err.fieldErrors) : [];
      const formFieldErrors = fieldErrors.filter(([field]) => FORM_FIELDS.has(field) && field !== "role");
      // Field problems (duplicate email/student number, invalid input): back to the form, input kept.
      if (formFieldErrors.length > 0) {
        for (const [field, message] of formFieldErrors) {
          form.setError(field as keyof AccountFieldsInput, { message });
        }
        setError(
          isApiError(err) && err.code === "DUPLICATE_VALUE"
            ? "An account with this email or student number already exists."
            : toUserMessage(err, "createAccount"),
        );
        setStep("form");
        return;
      }
      // A6 / A9 / A11: stay on review, keep everything, allow retry.
      setError(toUserMessage(err, "createAccount"));
    }
  };

  const reset = () => {
    form.reset(DEFAULTS);
    setFields(null);
    setOverride(null);
    setError(null);
    setCreated(null);
    setDigitsByRole(newDigits());
    setStep("form");
  };

  return (
    <SurfaceCard className="p-5 sm:p-7">
      <ol className="mb-6 flex flex-wrap gap-2 text-xs font-semibold" aria-label="Steps">
        {(["form", "review", "result"] as Step[]).map((s, i) => (
          <li
            key={s}
            aria-current={step === s ? "step" : undefined}
            className={step === s ? "rounded-pill bg-primary px-3 py-1 text-on-primary" : "rounded-pill bg-hover-tint px-3 py-1 text-text-muted"}
          >
            {i + 1}. {s === "form" ? "Details" : s === "review" ? "Review" : "Result"}
          </li>
        ))}
      </ol>

      {step === "form" ? (
        <>
          {error ? (
            <div ref={errorRef} tabIndex={-1} role="alert" className="mb-4 rounded-xl border border-danger/30 bg-danger-surface px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}
          <AccountForm form={form} faculties={faculties} onReview={review} onCancel={requestCancel} />
        </>
      ) : null}

      {step === "review" && fields ? (
        <AccountReview
          fields={fields}
          faculties={faculties.data ?? []}
          generatedPassword={generatedPassword}
          override={override}
          onOverrideChange={setOverride}
          error={error}
          errorRef={errorRef}
          submitting={pending}
          onBack={() => {
            setError(null);
            setStep("form");
          }}
          onCancel={requestCancel}
          onConfirm={confirm}
        />
      ) : null}

      {step === "result" && created ? <AccountResult created={created} onCreateAnother={reset} /> : null}

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard this account?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirmDiscard(false);
          leave();
        }}
        onCancel={() => setConfirmDiscard(false)}
      >
        Nothing has been saved. The information you entered will be lost.
      </ConfirmDialog>
    </SurfaceCard>
  );
}
