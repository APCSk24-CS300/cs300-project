import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { UserListView } from "@/features/admin-users/components/UserListView";

/** User Management (UC-29 steps 1–2, A1). */
export default function UserManagementPage() {
  return (
    <>
      <PageHeader
        title="User Management"
        description="Accounts and their roles."
        actions={<Button href="/admin/users/new">Create account</Button>}
      />
      <Suspense fallback={<LoadingState />}>
        <UserListView />
      </Suspense>
    </>
  );
}
