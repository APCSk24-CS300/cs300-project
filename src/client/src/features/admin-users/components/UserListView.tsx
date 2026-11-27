"use client";

import { ForbiddenView } from "@/components/layout/ForbiddenView";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { toUserMessage } from "@/libs/error-messages";
import { ROLE_LABEL } from "@/libs/roles";
import { useAccountList } from "@/features/admin-users/hooks/useAccountList";
import type { AccountSummary } from "@/features/admin-users/types/admin-users";
import { UserFilters } from "@/features/admin-users/components/UserFilters";

const dateFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" });

const COLUMNS: Column<AccountSummary>[] = [
  { key: "name", header: "Full name", cell: (u) => <span className="font-semibold">{u.fullName}</span> },
  { key: "email", header: "Email", cell: (u) => <span className="break-all">{u.email}</span> },
  { key: "role", header: "Role", cell: (u) => (u.role ? ROLE_LABEL[u.role] : "—") },
  {
    key: "status",
    header: "Status",
    cell: (u) => (
      <Badge tone={u.status === "active" ? "success" : "neutral"} withDot>
        {u.status === "active" ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  { key: "created", header: "Created", cell: (u) => dateFormat.format(u.createdAt) },
];

/** UC-29 steps 1–2 and A1 (FR-028, FR-029). */
export function UserListView() {
  const list = useAccountList();

  if (list.status === "forbidden") {
    return <ForbiddenView dashboardHref="/admin/dashboard" />;
  }

  const page = list.data;
  const hasFilters = Boolean(list.query.search || list.query.role);

  return (
    <div className="flex flex-col gap-4">
      <UserFilters
        search={list.query.search}
        role={list.query.role}
        onSearchChange={(search) => list.setQuery({ search })}
        onRoleChange={(role) => list.setQuery({ role })}
      />
      <DataTable
        caption="User accounts"
        columns={COLUMNS}
        rows={page?.items ?? []}
        rowKey={(u) => u.id}
        loading={list.status === "loading"}
        error={
          list.status === "error" ? (
            <ErrorState className="min-h-0 border-0" title="The accounts could not be loaded" description={toUserMessage(list.error, "load")} onRetry={list.retry} />
          ) : undefined
        }
        empty={
          <EmptyState
            className="min-h-0 border-0"
            title={hasFilters ? "No accounts match" : "No accounts yet"}
            description={hasFilters ? "Try another search or role." : undefined}
            action={
              hasFilters ? (
                <Button variant="white" onClick={list.clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        }
      />
      {page && list.status === "success" && page.totalItems > 0 ? (
        <Pagination page={page.page} totalPages={page.totalPages} onPageChange={(p) => list.setQuery({ page: p })} />
      ) : null}
    </div>
  );
}
