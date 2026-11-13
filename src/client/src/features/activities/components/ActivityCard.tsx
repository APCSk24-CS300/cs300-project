import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";
import { ACTIVITY_VIEW_LABEL } from "@/features/activities/config";
import { ActivityImage } from "@/features/activities/components/ActivityImage";
import { ActivityMeta } from "@/features/activities/components/ActivityMeta";
import { ActivityStatusBadge } from "@/features/activities/components/ActivityStatusBadge";
import type { Activity } from "@/features/activities/types";
import { formatActivityTime } from "@/libs/format";
import { cn } from "@/libs/cn";

type ActivityCardProps = {
  activity: Activity;
  variant: "featured" | "compact";
};

export function ActivityCard({ activity, variant }: ActivityCardProps) {
  const dateTime = formatActivityTime(activity.startTime, activity.endTime);
  const coverAlt = `${activity.title} cover image`;

  if (variant === "compact") {
    return (
      <Link
        href={activity.href}
        className="group flex gap-3 rounded-2xl bg-surface p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transform-none motion-reduce:transition-none"
      >
        <ActivityImage
          src={activity.imageUrl}
          alt={coverAlt}
          className="h-24 w-28 shrink-0 rounded-xl"
          sizes="112px"
        />
        <div className="min-w-0 flex-1 py-1">
          <h3 className="line-clamp-3 text-xs font-bold leading-5 text-text">
            {activity.title}
          </h3>
          <ActivityMeta
            compact
            categories={activity.categories.slice(0, 1)}
            dateTime={dateTime}
            location={activity.location}
          />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={activity.href}
      className="group flex h-full flex-col overflow-hidden rounded-card bg-surface p-4 shadow-card transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transform-none motion-reduce:transition-none"
    >
      <ActivityImage
        src={activity.imageUrl}
        alt={coverAlt}
        className="aspect-video w-full rounded-xl"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      <div className="flex flex-1 flex-col pt-4">
        <h3 className="line-clamp-4 text-sm font-bold leading-5 text-text">
          {activity.title}
        </h3>
        <div className="mt-3">
          <ActivityMeta
            categories={activity.categories}
            dateTime={dateTime}
            location={activity.location}
          />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <ActivityStatusBadge status={activity.registrationStatus} />
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium text-text-muted transition-colors group-hover:text-primary",
            )}
          >
            {ACTIVITY_VIEW_LABEL}
            <ArrowRightIcon
              aria-hidden="true"
              className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
