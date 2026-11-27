import { Button } from "@/components/ui/Button";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

export function Pagination({ page, totalPages, onPageChange, disabled = false }: PaginationProps) {
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 rounded-2xl border border-divider bg-surface px-4 py-2.5 shadow-xs"
    >
      <Button
        variant="ghost"
        size="sm"
        className="border border-divider bg-surface hover:bg-surface-muted"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <p className="text-sm font-medium text-text-muted tabular-nums" aria-live="polite">
        Page {page} of {totalPages}
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="border border-divider bg-surface hover:bg-surface-muted"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
