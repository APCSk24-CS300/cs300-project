import { Skeleton } from "@/components/ui/Skeleton";

function FeaturedSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-card bg-surface p-4 shadow-card">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
        <Skeleton className="mt-2 h-4 w-3/5" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
}

function CompactSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl bg-surface p-3 shadow-card">
      <Skeleton className="h-24 w-28 shrink-0 rounded-xl" />
      <div className="flex-1 py-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-4/5" />
        <Skeleton className="mt-3 h-3 w-2/5" />
        <Skeleton className="mt-1.5 h-3 w-3/5" />
        <Skeleton className="mt-1.5 h-3 w-1/2" />
      </div>
    </div>
  );
}

export function ActivitiesSkeleton() {
  return (
    <div
      data-testid="activities-skeleton"
      aria-hidden="true"
      className="grid gap-5 lg:grid-cols-[2fr_1fr]"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FeaturedSkeleton />
        <FeaturedSkeleton />
      </div>
      <div className="grid gap-4">
        <CompactSkeleton />
        <CompactSkeleton />
        <CompactSkeleton />
      </div>
    </div>
  );
}
