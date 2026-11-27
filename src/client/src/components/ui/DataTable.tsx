import type { ReactNode } from "react";
import { cn } from "@/libs/cn";
import { Skeleton } from "@/components/ui/Skeleton";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

type DataTableProps<T> = {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  /** Rendered full width instead of rows (EmptyState / ErrorState). */
  empty?: ReactNode;
  error?: ReactNode;
  skeletonRows?: number;
};

/** Semantic table with the shared loading / empty / error presentations (FR-026). */
export function DataTable<T>({ caption, columns, rows, rowKey, loading = false, empty, error, skeletonRows = 5 }: DataTableProps<T>) {
  const body = error ? (
    <tr>
      <td colSpan={columns.length} className="p-4">
        {error}
      </td>
    </tr>
  ) : loading ? (
    Array.from({ length: skeletonRows }, (_, i) => (
      <tr key={`skeleton-${i}`} aria-hidden="true">
        {columns.map((column) => (
          <td key={column.key} className="px-4 py-3">
            <Skeleton className="h-4 w-full" />
          </td>
        ))}
      </tr>
    ))
  ) : rows.length === 0 && empty ? (
    <tr>
      <td colSpan={columns.length} className="p-4">
        {empty}
      </td>
    </tr>
  ) : (
    rows.map((row) => (
      <tr key={rowKey(row)} className="border-t border-divider transition-colors hover:bg-surface-muted/40">
        {columns.map((column) => (
          <td key={column.key} className={cn("px-4 py-3.5 align-middle text-sm text-heading", column.className)}>
            {column.cell(row)}
          </td>
        ))}
      </tr>
    ))
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-divider bg-surface shadow-xs">
      <table className="w-full min-w-[640px] border-collapse text-left" aria-busy={loading || undefined}>
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-muted/60">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{body}</tbody>
      </table>
      {loading ? <span className="sr-only" role="status">Loading…</span> : null}
    </div>
  );
}
