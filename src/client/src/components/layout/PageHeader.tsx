import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "@/components/icons/NavIcons";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
};

/** The one page-title pattern used by every protected screen. */
export function PageHeader({ title, description, actions, backHref, backLabel = "Back" }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      {backHref ? (
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-primary"
          >
            <ArrowLeftIcon className="size-4" />
            <span>{backLabel}</span>
          </Link>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
