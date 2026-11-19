import { CalendarIcon } from "@/components/icons/CalendarIcon";
import { LocationIcon } from "@/components/icons/LocationIcon";
import { cn } from "@/libs/cn";

type ActivityMetaProps = {
  dateTime: string;
  location: string | null;
  categories?: string[];
  compact?: boolean;
};

export function ActivityMeta({
  dateTime,
  location,
  categories = [],
  compact = false,
}: ActivityMetaProps) {
  return (
    <div
      className={cn(
        "space-y-1.5 text-text-muted",
        compact ? "text-[11px]" : "text-xs",
      )}
    >
      {categories.length > 0 ? (
        <p className={cn(compact && "line-clamp-1")}>
          {categories.join(", ")}
        </p>
      ) : null}
      <p className="flex items-start gap-1.5">
        <CalendarIcon
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0"
        />
        <span>{dateTime}</span>
      </p>
      {location ? (
        <p className="flex items-start gap-1.5">
          <LocationIcon
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0"
          />
          <span className={cn(compact && "line-clamp-1")}>{location}</span>
        </p>
      ) : null}
    </div>
  );
}
