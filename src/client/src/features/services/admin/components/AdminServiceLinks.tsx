"use client";

import { useState } from "react";
import { ForbiddenView } from "@/components/layout/ForbiddenView";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ServiceLinkForm } from "@/features/services/admin/components/ServiceLinkForm";
import { useAdminServiceLinks } from "@/features/services/admin/hooks/useAdminServiceLinks";
import type { AdminHubService } from "@/features/services/admin/services/admin-hub.service";
import type { ServiceLinkFormValues } from "@/features/services/admin/schema/serviceLink.schema";
import type { UniversityService } from "@/features/services/types/service";
import { useAuth } from "@/hooks/useAuth";
import { useForbidden } from "@/hooks/useForbidden";
import { ApiError, isApiError } from "@/libs/api-client";
import { toUserMessage } from "@/libs/error-messages";
import { getDashboardPath } from "@/libs/navigation";

type Mode = { kind: "list" } | { kind: "add" } | { kind: "edit"; link: UniversityService };

type Banner = { tone: "success" | "error"; text: string; reload?: boolean } | null;

export const ADMIN_CONTENT = {
  title: "Service Links",
  description: "Links shown in University Services. Deactivated links are hidden from users but kept here.",
  add: "Add service",
  stale: toUserMessage(new ApiError({ status: 412, code: "PRECONDITION_FAILED" }), "manageServiceLink"),
  reload: "Reload",
  emptyTitle: "No service links yet",
  emptyDescription: "Add the first university service so users can reach it from the hub.",
  loadError: "Couldn't load service links",
};

function toFormValues(link: UniversityService): ServiceLinkFormValues {
  return {
    name: link.name,
    url: link.href,
    description: link.description ?? "",
    displayOrder: String(link.displayOrder),
    isActive: link.isActive,
  };
}

/** Error copy comes from toUserMessage (FR-011); stale (412) and missing (404) links offer a reload. */
function bannerFor(error: unknown): Banner {
  const reload = isApiError(error) && (error.code === "PRECONDITION_FAILED" || error.code === "NOT_FOUND");
  return { tone: "error", text: toUserMessage(error, "manageServiceLink"), reload };
}

/**
 * Service-link administration (BR-ADM-01, spec 004 US3): every link with its status; add and edit in a
 * dialog, deactivate after confirmation (FR-015), reactivate.
 */
export function AdminServiceLinks({ service }: { service?: AdminHubService }) {
  const links = useAdminServiceLinks(service);
  const { user } = useAuth();
  // Wiring rule: the component that runs mutations owns useForbidden; the read hook reports "forbidden".
  const forbidden = useForbidden();
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [confirming, setConfirming] = useState<UniversityService | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner>(null);

  async function run(link: UniversityService, action: () => Promise<UniversityService>, done: (l: UniversityService) => string) {
    setBusy(link.id);
    setBanner(null);
    try {
      const saved = await action();
      setBanner({ tone: "success", text: done(saved) });
    } catch (error) {
      if (!forbidden.handleError(error)) setBanner(bannerFor(error));
    } finally {
      setBusy(null);
    }
  }

  async function submitForm(payload: Parameters<typeof links.create>[0]) {
    setBanner(null);
    try {
      const saved = mode.kind === "edit" ? await links.update(mode.link, payload) : await links.create(payload);
      setMode({ kind: "list" });
      setBanner({ tone: "success", text: `Saved “${saved.name}”.` });
    } catch (error) {
      if (forbidden.handleError(error)) return;
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) throw error; // the form shows these
      setMode({ kind: "list" });
      setBanner(bannerFor(error));
    }
  }

  if (links.status === "forbidden" || forbidden.isForbidden) {
    return <ForbiddenView dashboardHref={getDashboardPath(user?.role)} />;
  }

  const columns: Column<UniversityService>[] = [
    {
      key: "order",
      header: "Order",
      className: "w-20 tabular-nums text-text-muted",
      cell: (link) => link.displayOrder,
    },
    {
      key: "service",
      header: "Service",
      cell: (link) => (
        <>
          <p className="font-semibold text-heading">{link.name}</p>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sm text-primary underline-offset-2 hover:underline"
          >
            {link.href}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (link) => (
        <Badge tone={link.isActive ? "success" : "neutral"} withDot>
          {link.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (link) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Edit ${link.name}`}
            onClick={() => {
              setBanner(null);
              setMode({ kind: "edit", link });
            }}
          >
            Edit
          </Button>
          {link.isActive ? (
            <Button size="sm" variant="ghost" aria-label={`Deactivate ${link.name}`} isLoading={busy === link.id} onClick={() => setConfirming(link)}>
              Deactivate
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Reactivate ${link.name}`}
              isLoading={busy === link.id}
              onClick={() => run(link, () => links.reactivate(link), (l) => `“${l.name}” is back in the hub.`)}
            >
              Reactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={ADMIN_CONTENT.title}
        description={ADMIN_CONTENT.description}
        actions={
          links.status === "ready" ? (
            <Button
              onClick={() => {
                setBanner(null);
                setMode({ kind: "add" });
              }}
            >
              {ADMIN_CONTENT.add}
            </Button>
          ) : undefined
        }
      />

      {banner ? (
        <Alert variant={banner.tone}>
          <div className="flex flex-wrap items-center gap-3">
            <span>{banner.text}</span>
            {banner.reload ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setBanner(null);
                  links.reload();
                }}
              >
                {ADMIN_CONTENT.reload}
              </Button>
            ) : null}
          </div>
        </Alert>
      ) : null}

      <DataTable
        caption={ADMIN_CONTENT.title}
        columns={columns}
        rows={links.links ?? []}
        rowKey={(link) => link.id}
        loading={links.status === "loading"}
        skeletonRows={4}
        error={
          links.status === "error" ? (
            <ErrorState
              className="min-h-0 border-0"
              title={ADMIN_CONTENT.loadError}
              description={toUserMessage(links.error, "load")}
              onRetry={links.reload}
            />
          ) : undefined
        }
        empty={<EmptyState className="min-h-0 border-0" title={ADMIN_CONTENT.emptyTitle} description={ADMIN_CONTENT.emptyDescription} />}
      />

      <Dialog
        open={mode.kind !== "list"}
        title={mode.kind === "edit" ? `Edit ${mode.link.name}` : ADMIN_CONTENT.add}
        onClose={() => setMode({ kind: "list" })}
      >
        <ServiceLinkForm
          key={mode.kind === "edit" ? mode.link.id : "add"}
          initial={mode.kind === "edit" ? toFormValues(mode.link) : undefined}
          submitLabel={mode.kind === "edit" ? "Save changes" : ADMIN_CONTENT.add}
          onSubmit={submitForm}
          onCancel={() => setMode({ kind: "list" })}
        />
      </Dialog>

      <ConfirmDialog
        open={confirming !== null}
        title={confirming ? `Deactivate ${confirming.name}?` : "Deactivate"}
        confirmLabel="Deactivate"
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          const link = confirming;
          setConfirming(null);
          if (link) void run(link, () => links.deactivate(link), (l) => `“${l.name}” is now hidden from the hub.`);
        }}
      >
        It disappears from University Services for every user. The link is kept here and can be reactivated.
      </ConfirmDialog>
    </div>
  );
}
