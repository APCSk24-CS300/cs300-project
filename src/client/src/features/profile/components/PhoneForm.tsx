"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";
import { profileService } from "@/features/profile/services/profile.service";
import type { Profile } from "@/features/profile/types/profile";
import { isApiError } from "@/libs/api-client";
import { toUserMessage } from "@/libs/error-messages";
import { PHONE_INVALID, isValidPhoneNumber, toPhoneNumberValue } from "@/libs/validation/phone";

const PhoneSchema = z.object({ phoneNumber: z.string().refine(isValidPhoneNumber, PHONE_INVALID) });
type PhoneValues = z.infer<typeof PhoneSchema>;

type PhoneFormProps = {
  phoneNumber: string | null;
  /** The server-confirmed profile after a save. */
  onSaved: (profile: Profile) => void;
};

/**
 * UC-03 steps 3–4 for the one editable field. Edit → Save / Cancel (A1 discards). The shared phone
 * rule runs before sending (A5); a server field error (400 { field }) or a taken number (409) is shown
 * on the field and the draft is kept; other failures are an alert (A9).
 */
export function PhoneForm({ phoneNumber, onSaved }: PhoneFormProps) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const form = useForm<PhoneValues>({ resolver: zodResolver(PhoneSchema), defaultValues: { phoneNumber: "" } });
  const { errors, isSubmitting } = form.formState;

  function start() {
    form.reset({ phoneNumber: phoneNumber ?? "" });
    setSaved(false);
    setFailure(null);
    setEditing(true);
  }

  function cancel() {
    form.reset({ phoneNumber: "" });
    setFailure(null);
    setEditing(false);
  }

  async function save({ phoneNumber: draft }: PhoneValues) {
    setFailure(null);
    try {
      onSaved(await profileService.updatePhoneNumber(toPhoneNumberValue(draft)));
      setEditing(false);
      setSaved(true);
    } catch (error) {
      const fieldMessage = isApiError(error) ? error.fieldErrors.phoneNumber : undefined;
      if (isApiError(error) && error.code === "DUPLICATE_VALUE") {
        form.setError("phoneNumber", { message: toUserMessage(error, "profilePhone") });
      } else if (fieldMessage && isApiError(error) && error.code === "VALIDATION_FAILED") {
        form.setError("phoneNumber", { message: fieldMessage });
      } else {
        setFailure(toUserMessage(error, "profilePhone"));
      }
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-3">
        <dl>
          <div className="rounded-2xl border border-divider bg-surface px-4 py-3">
            <dt className="text-sm font-medium text-text-muted">Phone number</dt>
            <dd className="mt-1 break-words text-base font-semibold text-heading">
              {phoneNumber ?? <span className="font-normal text-text-muted">Not provided</span>}
            </dd>
          </div>
        </dl>
        <div>
          <Button size="sm" variant="secondary" onClick={start} aria-label="Edit phone number">
            Edit
          </Button>
        </div>
        {saved ? <Alert variant="success">Phone number updated successfully.</Alert> : null}
      </div>
    );
  }

  return (
    <form noValidate aria-label="Phone number" className="flex flex-col gap-4" onSubmit={form.handleSubmit(save)}>
      <FormField
        label="Phone number"
        size="comfortable"
        hint="0 followed by 9 digits, or +84 followed by 9 digits. Leave empty to remove it."
        error={errors.phoneNumber?.message}
      >
        <TextInput type="tel" inputMode="tel" autoComplete="tel" {...form.register("phoneNumber")} />
      </FormField>
      {failure ? <Alert variant="error">{failure}</Alert> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="sm" isLoading={isSubmitting} disabled={isSubmitting}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={cancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
