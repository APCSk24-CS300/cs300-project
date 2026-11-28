import { PHONE_INVALID, isValidPhoneNumber } from "@/libs/validation/phone";

/** The shared phone rule (libs/validation/phone.ts). TODO(006 step 6): the phone form uses it directly. */
export function getPhoneNumberError(phoneNumber: string): string | null {
  return isValidPhoneNumber(phoneNumber) ? null : PHONE_INVALID;
}
