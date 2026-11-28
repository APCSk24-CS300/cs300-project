"use client";

import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ROLE_LABEL, type RoleCode } from "@/libs/roles";
import { useRolePermissions } from "@/features/admin-users/hooks/useRolePermissions";

/** The permissions the chosen role grants, shown before confirming (NFR-USA-13). */
export function RolePermissionsPanel({ role }: { role: RoleCode }) {
  const permissions = useRolePermissions(role);

  return (
    <section aria-labelledby="permissions-heading" className="rounded-2xl border border-divider bg-surface p-5">
      <h3 id="permissions-heading" className="text-base font-semibold text-heading">
        Permissions granted by {ROLE_LABEL[role]}
      </h3>
      {permissions.status === "loading" ? (
        <LoadingState label="Loading permissions…" />
      ) : permissions.status === "success" ? (
        permissions.data && permissions.data.permissions.length > 0 ? (
          <ul className="mt-3 divide-y divide-divider rounded-xl border border-divider bg-surface-muted/30">
            {permissions.data.permissions.map((p) => (
              <li key={p.code} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[15px] text-text">
                <span>{p.description || p.code}</span>
                <span className="rounded-md bg-surface px-2.5 py-0.5 font-mono text-[13px] text-text-muted">({p.code})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[15px] text-text-muted">No permissions</p>
        )
      ) : (
        <div className="mt-2 flex items-center gap-3">
          <p className="text-[15px] text-danger">The permissions could not be loaded.</p>
          <Button variant="ghost" size="sm" className="border border-divider" onClick={permissions.retry}>
            Retry
          </Button>
        </div>
      )}
    </section>
  );
}
