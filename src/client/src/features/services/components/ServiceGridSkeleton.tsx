import { Skeleton } from "@/components/ui/Skeleton";

/** Placeholder cards while services load. */
export function ServiceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading university services" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-[76px] rounded-2xl" />
      ))}
    </div>
  );
}
