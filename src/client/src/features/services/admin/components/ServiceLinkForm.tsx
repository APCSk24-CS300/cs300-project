"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { TextInput, inputClasses } from "@/components/ui/TextInput";
import {
  EMPTY_SERVICE_LINK_FORM,
  ServiceLinkFormSchema,
  toServiceLinkPayload,
  type ServiceLinkFormValues,
} from "@/features/services/admin/schema/serviceLink.schema";
import { ApiError } from "@/libs/api-client";
import { cn } from "@/libs/cn";

type Payload = ReturnType<typeof toServiceLinkPayload>;

type ServiceLinkFormProps = {
  /** Values to edit, or undefined for a new link. */
  initial?: ServiceLinkFormValues;
  submitLabel: string;
  onSubmit: (payload: Payload) => Promise<unknown>;
  onCancel: () => void;
};

const FIELDS = ["name", "url", "description", "displayOrder", "isActive"] as const;

/**
 * Add / edit form for one service link (shown in a dialog). The zod schema mirrors the backend rules;
 * field errors the backend still returns (400 details, 409 name) are shown on their fields.
 */
export function ServiceLinkForm({ initial, submitLabel, onSubmit, onCancel }: ServiceLinkFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServiceLinkFormValues>({
    resolver: zodResolver(ServiceLinkFormSchema),
    defaultValues: initial ?? EMPTY_SERVICE_LINK_FORM,
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(toServiceLinkPayload(ServiceLinkFormSchema.parse(values)));
    } catch (error) {
      const entries = error instanceof ApiError ? Object.entries(error.fieldErrors) : [];
      if (entries.length > 0) {
        for (const [name, message] of entries) {
          const field = (FIELDS as readonly string[]).includes(name) ? (name as (typeof FIELDS)[number]) : "root";
          setError(field, { message });
        }
        return;
      }
      throw error;
    }
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2" aria-label={submitLabel}>
      <FormField label="Name" required size="comfortable" error={errors.name?.message}>
        <TextInput autoComplete="off" {...register("name")} />
      </FormField>
      <FormField label="Address (URL)" required size="comfortable" error={errors.url?.message}>
        <TextInput type="url" inputMode="url" placeholder="https://" {...register("url")} />
      </FormField>
      <FormField label="Description" size="comfortable" className="sm:col-span-2" error={errors.description?.message}>
        <textarea rows={2} className={cn(inputClasses, "h-auto py-3")} {...register("description")} />
      </FormField>
      <FormField
        label="Order"
        size="comfortable"
        hint="Lower comes first. Leave empty to add it last."
        error={errors.displayOrder?.message}
      >
        <TextInput inputMode="numeric" {...register("displayOrder")} />
      </FormField>
      <div className="flex items-end">
        <label className="inline-flex min-h-12 items-center gap-2 text-[15px] text-heading">
          <input type="checkbox" className="size-4 accent-primary" {...register("isActive")} />
          Show in the hub
        </label>
      </div>
      {errors.root?.message ? (
        <Alert variant="error" className="sm:col-span-2">
          {errors.root.message}
        </Alert>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
