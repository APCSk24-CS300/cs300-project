import { ActivityCard } from "@/features/activities/components/ActivityCard";
import type { LandingActivities } from "@/features/activities/types";

type ActivityGridProps = {
  activities: LandingActivities;
};

export function ActivityGrid({ activities }: ActivityGridProps) {
  const { featured, upcoming } = activities;

  if (featured.length === 0 && upcoming.length === 0) {
    return null;
  }

  if (featured.length > 0 && upcoming.length > 0) {
    return (
      <div
        data-testid="activity-grid"
        data-layout="grouped"
        className="grid gap-5 lg:grid-cols-[2fr_1fr]"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {featured.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              variant="featured"
            />
          ))}
        </div>
        <div className="grid gap-4">
          {upcoming.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              variant="compact"
            />
          ))}
        </div>
      </div>
    );
  }

  if (featured.length > 0) {
    return (
      <div
        data-testid="activity-grid"
        data-layout="featured-only"
        className={
          featured.length === 1
            ? "grid gap-5"
            : "grid gap-5 sm:grid-cols-2"
        }
      >
        {featured.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            variant="featured"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid="activity-grid"
      data-layout="upcoming-only"
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {upcoming.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          variant="featured"
        />
      ))}
    </div>
  );
}
