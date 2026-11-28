"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ServiceLinkForm } from "@/features/services/admin/components/ServiceLinkForm";
import { useAdminServiceLinks } from "@/features/services/admin/hooks/useAdminServiceLinks";
import type { AdminHubService } from "@/features/services/admin/services/admin-hub.service";
import type { ServiceLinkFormValues } from "@/features/services/admin/schema/serviceLink.schema";
import type { UniversityService } from "@/features/services/types/service";
import { ApiError } from "@/libs/api-client";

type Mode = { kind: "list" } | { kind: "add" } | { kind: "edit"; link: UniversityService };

type Banner = { tone: "success" | "error"; text: string; reload?: boolean } | null;

export const ADMIN_CONTENT = {
  title: "University service links",
  description: "Links shown in the University Services hub. Deactivated links are hidden from users but kept here.",
  add: "Add service",
  stale: "This link was changed by someone else. Reload to see the latest version, then try again.",
  failed: "The change could not be saved. Please try again.",
  reload: "Reload",
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

function bannerFor(error: unknown): Banner {
  if (error instanceof ApiError && error.status === 412) return { tone: "error", text: ADMIN_CONTENT.stale, reload: true };
  if (error instanceof ApiError && error.status === 404) return { tone: "error", text: "This link no longer exists.", reload: true };
  return { tone: "error", text: ADMIN_CONTENT.failed };
}

/** Admin page body: list every link, add, edit, deactivate (with confirmation) and reactivate. */
export function AdminServiceLinks({ service }: { service?: AdminHubService }) {
  const links = useAdminServiceLinks(service);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner>(null);

  async function run(linkId: string, action: () => Promise<UniversityService>, done: (l: UniversityService) => string) {
    setBusy(linkId);
    setBanner(null);
    try {
      const saved = await action();
      setBanner({ tone: "success", text: done(saved) });
    } catch (error) {
      setBanner(bannerFor(error));
    } finally {
      setBusy(null);
      setConfirming(null);
    }
  }

  async function submitForm(payload: Parameters<typeof links.create>[0]) {
    setBanner(null);
    try {
      const saved = mode.kind === "edit" ? await links.update(mode.link, payload) : await links.create(payload);
      setMode({ kind: "list" });
      setBanner({ tone: "success", text: `Saved “${saved.name}”.` });
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.length > 0) throw error; // the form shows these
      setBanner(bannerFor(error));
    }
  }

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-text">{ADMIN_CONTENT.title}</h1>
        <p className="mt-2 max-w-2xl text-text-muted">{ADMIN_CONTENT.description}</p>
      </div>
      {mode.kind === "list" && links.status === "ready" ? (
        <Button onClick={() => { setBanner(null); setMode({ kind: "add" }); }}>{ADMIN_CONTENT.add}</Button>
      ) : null}
    </div>
  );

  const bannerView = banner ? (
    <div
      role={banner.tone === "error" ? "alert" : "status"}
      className={`mt-6 flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 text-sm ${banner.tone === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"}`}
    >
      <span>{banner.text}</span>
      {banner.reload ? (
        <Button size="sm" variant="ghost" onClick={() => { setBanner(null); setMode({ kind: "list" }); links.reload(); }}>
          {ADMIN_CONTENT.reload}
        </Button>
      ) : null}
    </div>
  ) : null;

  if (links.status === "loading") {
    return (
      <>
        {header}
        <div role="status" aria-label="Loading service links" className="mt-8 grid gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}
        </div>
      </>
    );
  }

  if (links.status === "error") {
    return (
      <>
        {header}
        <ErrorState className="mt-8" title="Couldn't load service links" onRetry={links.reload} />
      </>
    );
  }

  return (
    <>
      {header}
      {bannerView}

      {mode.kind !== "list" ? (
        <section aria-label={mode.kind === "add" ? "Add service" : `Edit ${mode.link.name}`} className="mt-8 rounded-2xl bg-surface p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-text">{mode.kind === "add" ? "Add service" : `Edit ${mode.link.name}`}</h2>
          <ServiceLinkForm
            initial={mode.kind === "edit" ? toFormValues(mode.link) : undefined}
            submitLabel={mode.kind === "add" ? "Add service" : "Save changes"}
            onSubmit={submitForm}
            onCancel={() => setMode({ kind: "list" })}
          />
        </section>
      ) : null}

      {links.links.length === 0 ? (
        <EmptyState className="mt-8" title="No service links yet" description="Add the first university service so users can reach it from the hub." />
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl bg-surface shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">{ADMIN_CONTENT.title}</caption>
            <thead className="border-b border-slate-200 text-text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Order</th>
                <th scope="col" className="px-4 py-3 font-medium">Service</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {links.links.map((link) => (
                <tr key={link.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 tabular-nums">{link.displayOrder}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">{link.name}</p>
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="break-all text-xs text-primary underline-offset-2 hover:underline">
                      {link.href}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${link.isActive ? "bg-green-50 text-green-800" : "bg-slate-100 text-slate-700"}`}>
                      {link.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {confirming === link.id ? (
                      <div className="flex flex-wrap items-center justify-end gap-2" role="group" aria-label={`Confirm deactivating ${link.name}`}>
                        <span className="text-xs text-text-muted">Hide “{link.name}” from the hub?</span>
                        <Button size="sm" variant="secondary" isLoading={busy === link.id}
                          onClick={() => run(link.id, () => links.deactivate(link), (l) => `“${l.name}” is now hidden from the hub.`)}>
                          Deactivate
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" aria-label={`Edit ${link.name}`}
                          onClick={() => { setBanner(null); setMode({ kind: "edit", link }); }}>
                          Edit
                        </Button>
                        {link.isActive ? (
                          <Button size="sm" variant="ghost" aria-label={`Deactivate ${link.name}`} onClick={() => setConfirming(link.id)}>
                            Deactivate
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" aria-label={`Reactivate ${link.name}`} isLoading={busy === link.id}
                            onClick={() => run(link.id, () => links.reactivate(link), (l) => `“${l.name}” is back in the hub.`)}>
                            Reactivate
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
