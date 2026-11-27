"use client";

import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextInput } from "@/components/ui/TextInput";
import { ROLE_CODES, ROLE_LABEL } from "@/libs/roles";
import type { AccountFieldsInput } from "@/features/admin-users/schema/new-account.schema";
import type { Resource } from "@/features/admin-users/hooks/useAsyncResource";
import type { Faculty } from "@/features/admin-users/types/admin-users";

type AccountFormProps = {
  form: UseFormReturn<AccountFieldsInput>;
  faculties: Resource<Faculty[]>;
  onReview: () => void;
  onCancel: () => void;
};

const ROLE_OPTIONS = ROLE_CODES.map((code) => ({ value: code, label: ROLE_LABEL[code] }));

/** UC-29 steps 3–4: one account, exactly one role (FR-030, FR-031). */
export function AccountForm({ form, faculties, onReview, onCancel }: AccountFormProps) {
  const { register, control, formState, clearErrors } = form;
  const errors = formState.errors;
  const role = useWatch({ control, name: "role" });
  const isStudent = role === "student";
  const facultiesReady = faculties.status === "success";

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onReview();
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Email" required error={errors.email?.message}>
          <TextInput type="email" autoComplete="off" {...register("email")} />
        </FormField>
        <FormField label="Full name" required error={errors.fullName?.message}>
          <TextInput autoComplete="off" {...register("fullName")} />
        </FormField>
      </div>

      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <RadioGroup
            legend="Role"
            name="role"
            required
            options={ROLE_OPTIONS}
            value={field.value}
            onChange={(value) => {
              field.onChange(value);
              // Student fields are dropped for other roles; clear their stale errors.
              if (value !== "student") clearErrors(["studentNumber", "facultyId"]);
            }}
            error={errors.role?.message}
          />
        )}
      />

      <FormField label="Phone number" error={errors.phoneNumber?.message}>
        <TextInput type="tel" autoComplete="off" {...register("phoneNumber")} />
      </FormField>

      {isStudent ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Student number" required error={errors.studentNumber?.message}>
            <TextInput autoComplete="off" {...register("studentNumber")} />
          </FormField>
          {faculties.status === "loading" ? (
            <div className="flex flex-col gap-1.5" role="status" aria-busy="true">
              <span className="text-sm font-semibold text-heading">Faculty</span>
              <Skeleton className="h-12 w-full rounded-2xl" />
              <span className="sr-only">Loading faculties…</span>
            </div>
          ) : faculties.status === "success" ? (
            <FormField label="Faculty" required error={errors.facultyId?.message}>
              <Select
                placeholder="Choose a faculty"
                options={(faculties.data ?? []).map((f) => ({ value: f.id, label: f.name }))}
                {...register("facultyId")}
              />
            </FormField>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-heading">Faculty</span>
              <p role="alert" className="text-sm text-danger">
                The faculty list could not be loaded.
              </p>
              <Button variant="white" size="sm" onClick={faculties.retry}>
                Retry
              </Button>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isStudent && !facultiesReady}>
          Review
        </Button>
      </div>
    </form>
  );
}
