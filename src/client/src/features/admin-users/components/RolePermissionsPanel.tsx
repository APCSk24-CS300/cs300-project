"use client";

import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ROLE_LABEL, type RoleCode } from "@/libs/roles";
import { useRolePermissions } from "@/features/admin-users/hooks/useRolePermissions";

/** The permissions the chosen role grants, shown before confirming (NFR-USA-13). */
export function RolePermissionsPanel({ role }: { role: RoleCode }) {
  const permissions = useRolePermissions(role);

  return (
    <section aria-labelledby="permissions-heading" className="rounded-2xl border border-border p-4">
      <h3 id="permissions-heading" className="text-sm font-semibold text-heading">
        Permissions granted by {ROLE_LABEL[role]}
      </h3>
      {permissions.status === "loading" ? (
        <LoadingState label="Loading permissions…" />
      ) : permissions.status === "success" ? (
        permissions.data && permissions.data.permissions.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text">
            {permissions.data.permissions.map((p) => (
              <li key={p.code}>
                {p.description || p.code} <span className="text-xs text-text-muted">({p.code})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-text-muted">No permissions</p>
        )
      ) : (
        <div className="mt-2 flex items-center gap-3">
          <p className="text-sm text-danger">The permissions could not be loaded.</p>
          <Button variant="white" size="sm" onClick={permissions.retry}>
            Retry
          </Button>
        </div>
      )}
    </section>
  );
}
