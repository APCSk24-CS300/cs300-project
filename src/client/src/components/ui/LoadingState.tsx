import { cn } from "@/libs/cn";
import { Skeleton } from "@/components/ui/Skeleton";

type LoadingStateProps = {
  variant?: "page" | "section";
  label?: string;
  className?: string;
};

/** The one loading presentation for every screen (FR-026). Keeps layout stable. */
export function LoadingState({ variant = "section", label = "Loading…", className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        "flex w-full flex-col gap-3",
        variant === "page" ? "min-h-[60vh] items-center justify-center p-8" : "p-4",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      {variant === "page" ? (
        <div className="flex w-full max-w-md flex-col gap-3">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : (
        <>
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </>
      )}
    </div>
  );
}
