const PHONE_NUMBER_PATTERN = /^(?:0\d{9}|\+84\d{9})$/;

export function getPhoneNumberError(phoneNumber: string): string | null {
  if (phoneNumber === "" || PHONE_NUMBER_PATTERN.test(phoneNumber)) {
    return null;
  }

  return "Enter a 10-digit number starting with 0 or +84 followed by 9 digits.";
}
