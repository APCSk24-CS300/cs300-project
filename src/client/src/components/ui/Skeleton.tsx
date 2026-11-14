import { cn } from "@/libs/cn";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none",
        className,
      )}
    />
  );
}
