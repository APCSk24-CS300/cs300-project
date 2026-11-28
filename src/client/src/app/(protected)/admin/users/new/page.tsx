import { PageHeader } from "@/components/layout/PageHeader";
import { CreateAccountWizard } from "@/features/admin-users/components/CreateAccountWizard";

/** UC-29 steps 3–8 (subset): create one account with exactly one role. */
export default function CreateAccountPage() {
  return (
    <>
      <PageHeader
        backHref="/admin/users"
        backLabel="Back to User Management"
        title="Create account"
        description="Create one user account with exactly one role."
      />
      <CreateAccountWizard />
    </>
  );
}
