"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import {
  EMPTY_SERVICE_LINK_FORM,
  ServiceLinkFormSchema,
  toServiceLinkPayload,
  type ServiceLinkFormValues,
} from "@/features/services/admin/schema/serviceLink.schema";
import { ApiError } from "@/libs/api-client";

type Payload = ReturnType<typeof toServiceLinkPayload>;

type ServiceLinkFormProps = {
  /** Values to edit, or undefined for a new link. */
  initial?: ServiceLinkFormValues;
  submitLabel: string;
  onSubmit: (payload: Payload) => Promise<unknown>;
  onCancel: () => void;
};

const FIELDS = ["name", "url", "description", "displayOrder", "isActive"] as const;

/** Add / edit form for one service link. Shows field errors from the schema and from the backend (400/409). */
export function ServiceLinkForm({ initial, submitLabel, onSubmit, onCancel }: ServiceLinkFormProps) {
  const id = useId();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceLinkFormValues>({
    resolver: zodResolver(ServiceLinkFormSchema),
    defaultValues: initial ?? EMPTY_SERVICE_LINK_FORM,
  });

  useEffect(() => {
    reset(initial ?? EMPTY_SERVICE_LINK_FORM);
  }, [initial, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(toServiceLinkPayload(ServiceLinkFormSchema.parse(values)));
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        for (const fieldError of error.fieldErrors) {
          const field = (FIELDS as readonly string[]).includes(fieldError.field)
            ? (fieldError.field as (typeof FIELDS)[number])
            : "root";
          setError(field, { message: fieldError.message });
        }
        return;
      }
      throw error;
    }
  });

  const fieldClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-sm text-text focus-visible:outline-2 focus-visible:outline-focus-ring aria-[invalid=true]:border-red-500";
  const errorText = (name: keyof ServiceLinkFormValues) =>
    errors[name]?.message ? (
      <p id={`${id}-${name}-error`} className="mt-1 text-xs text-red-600">
        {errors[name]?.message}
      </p>
    ) : null;
  const describedBy = (name: keyof ServiceLinkFormValues) => (errors[name] ? `${id}-${name}-error` : undefined);

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2" aria-label={submitLabel}>
      <div>
        <label htmlFor={`${id}-name`} className="text-sm font-medium text-text">Name</label>
        <input id={`${id}-name`} className={fieldClass} aria-invalid={Boolean(errors.name)} aria-describedby={describedBy("name")} {...register("name")} />
        {errorText("name")}
      </div>
      <div>
        <label htmlFor={`${id}-url`} className="text-sm font-medium text-text">Address (URL)</label>
        <input id={`${id}-url`} type="url" inputMode="url" placeholder="https://" className={fieldClass} aria-invalid={Boolean(errors.url)} aria-describedby={describedBy("url")} {...register("url")} />
        {errorText("url")}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${id}-description`} className="text-sm font-medium text-text">Description (optional)</label>
        <textarea id={`${id}-description`} rows={2} className={fieldClass} aria-invalid={Boolean(errors.description)} aria-describedby={describedBy("description")} {...register("description")} />
        {errorText("description")}
      </div>
      <div>
        <label htmlFor={`${id}-order`} className="text-sm font-medium text-text">Order (optional, lower comes first)</label>
        <input id={`${id}-order`} inputMode="numeric" className={fieldClass} aria-invalid={Boolean(errors.displayOrder)} aria-describedby={describedBy("displayOrder")} {...register("displayOrder")} />
        {errorText("displayOrder")}
      </div>
      <div className="flex items-end">
        <label className="inline-flex min-h-10 items-center gap-2 text-sm text-text">
          <input type="checkbox" className="size-4" {...register("isActive")} />
          Show in the hub
        </label>
      </div>
      {errors.root?.message ? <p role="alert" className="text-sm text-red-600 sm:col-span-2">{errors.root.message}</p> : null}
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>{submitLabel}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
