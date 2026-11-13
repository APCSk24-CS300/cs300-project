import type { ReactNode } from "react";
import { cn } from "@/libs/cn";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[360px] flex-col items-center justify-center rounded-card border border-dashed border-slate-300 bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div aria-hidden="true" className="mb-4 text-primary">
          {icon}
        </div>
      ) : null}
      <p className="text-lg font-semibold text-text">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
