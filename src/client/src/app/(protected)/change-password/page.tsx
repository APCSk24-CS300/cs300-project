import { PageHeader } from "@/components/layout/PageHeader";
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";

type Props = { searchParams: Promise<{ redirectTo?: string | string[] }> };

/** US7: "Set a new password" at first sign-in (FR-044–FR-048). */
export default async function SetNewPasswordPage({ searchParams }: Props) {
  const { redirectTo } = await searchParams;
  return (
    <>
      <PageHeader title="Set a new password" />
      <ChangePasswordForm redirectTo={Array.isArray(redirectTo) ? redirectTo[0] : redirectTo} />
    </>
  );
}
