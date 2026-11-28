import { cn } from "@/libs/cn";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-skeleton motion-reduce:animate-none",
        className,
      )}
    />
  );
}
