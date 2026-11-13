import { cn } from "@/libs/cn";
import { Button } from "@/components/ui/Button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[360px] flex-col items-center justify-center rounded-card border border-slate-200 bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600"
      >
        !
      </span>
      <p className="text-lg font-semibold text-text">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
          {description}
        </p>
      ) : null}
      {onRetry ? (
        <Button className="mt-6" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
