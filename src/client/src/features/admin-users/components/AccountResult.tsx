import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CopyField } from "@/components/ui/CopyField";
import { ROLE_LABEL } from "@/libs/roles";
import type { CreatedAccount } from "@/features/admin-users/types/admin-users";

/** UC-29 step 8: the created account and its temporary password, shown once (FR-036c). */
export function AccountResult({ created, onCreateAnother }: { created: CreatedAccount; onCreateAnother: () => void }) {
  const { account, temporaryPassword } = created;
  return (
    <div className="flex flex-col gap-5">
      <Alert variant="success" title="Account created">
        {account.fullName} ({account.email}) can sign in now as {account.role ? ROLE_LABEL[account.role] : "—"}.
      </Alert>
      <CopyField label="Temporary password" value={temporaryPassword} />
      <p className="text-sm text-text-muted">
        This password is shown only once. Share it with the user; they must set a new password at first sign-in.
      </p>
      <div className="flex flex-wrap justify-end gap-3 border-t border-divider pt-5">
        <Button
          variant="ghost"
          className="border border-divider bg-surface hover:bg-surface-muted"
          onClick={onCreateAnother}
        >
          Create another
        </Button>
        <Button href="/admin/users">Back to User Management</Button>
      </div>
    </div>
  );
}
