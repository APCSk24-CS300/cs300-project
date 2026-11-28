import { Alert, type AlertVariant } from "@/components/ui/Alert";
import type { SignOutReason } from "@/features/auth/types/auth";

const NOTICES: Record<SignOutReason, { variant: AlertVariant; text: string }> = {
  "signed-out": { variant: "info", text: "You have been signed out." },
  "logout-unconfirmed": {
    variant: "warning",
    text: "You have been signed out on this device, but we could not confirm it with the server.",
  },
  expired: { variant: "info", text: "Your session has expired. Please sign in again." },
  disabled: { variant: "error", text: "This account is disabled. Contact the administrator." },
  "role-missing": { variant: "error", text: "This account cannot be signed in. Contact the administrator." },
};

export function isSignOutReason(value: unknown): value is SignOutReason {
  return typeof value === "string" && value in NOTICES;
}

/** Notice on /login for `?reason=` (FR-007, FR-016, FR-018, FR-018a). */
export function LogoutNotice({ reason }: { reason?: string }) {
  if (!isSignOutReason(reason)) {
    return null;
  }
  const notice = NOTICES[reason];
  return <Alert variant={notice.variant}>{notice.text}</Alert>;
}
