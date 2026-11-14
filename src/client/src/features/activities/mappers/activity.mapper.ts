import type {
  Activity,
  LandingActivities,
  LandingActivitiesDTO,
  RegistrationStatus,
} from "@/features/activities/types";

export type InvalidLandingActivitiesCode =
  | "INVALID_PAYLOAD"
  | "NO_USABLE_ITEMS";

export class InvalidLandingActivitiesError extends Error {
  readonly code: InvalidLandingActivitiesCode;

  constructor(code: InvalidLandingActivitiesCode) {
    super(
      code === "INVALID_PAYLOAD"
        ? "The landing activities payload could not be interpreted."
        : "The landing activities payload contained no usable items.",
    );
    this.name = "InvalidLandingActivitiesError";
    this.code = code;
  }
}

const REGISTRATION_STATUSES: RegistrationStatus[] = [
  "open",
  "upcoming",
  "closed",
];

const ISO_WITH_TIMEZONE = /(?:Z|[+-]\d{2}:\d{2})$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !ISO_WITH_TIMEZONE.test(value.trim())) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeCategories(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((category) => (typeof category === "string" ? category.trim() : ""))
    .filter((category) => category.length > 0);
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function mapActivityDTO(dto: unknown): Activity | null {
  if (!isRecord(dto)) {
    return null;
  }

  const id = nonEmptyString(dto.id);
  const title =
    typeof dto.title === "string" && dto.title.trim().length > 0
      ? dto.title
      : null;
  const startTime = parseDate(dto.start_time);
  const endTime = parseDate(dto.end_time);

  if (!id || !title || !startTime || !endTime) {
    return null;
  }

  if (endTime.getTime() < startTime.getTime()) {
    return null;
  }

  if (
    typeof dto.registration_status !== "string" ||
    !REGISTRATION_STATUSES.includes(
      dto.registration_status as RegistrationStatus,
    )
  ) {
    return null;
  }

  return {
    id,
    title,
    imageUrl: normalizeOptionalString(dto.image_url),
    categories: normalizeCategories(dto.categories),
    startTime,
    endTime,
    location: normalizeOptionalString(dto.location),
    registrationStatus: dto.registration_status as RegistrationStatus,
    href: `/activities/${encodeURIComponent(id)}`,
  };
}

function mapList(items: unknown[]): Activity[] {
  return items
    .map((item) => mapActivityDTO(item))
    .filter((activity): activity is Activity => activity !== null);
}

export function mapLandingActivitiesDTO(
  dto: LandingActivitiesDTO | unknown,
): LandingActivities {
  if (!isRecord(dto)) {
    throw new InvalidLandingActivitiesError("INVALID_PAYLOAD");
  }

  const hasList = Object.prototype.hasOwnProperty.call(dto, "activities");
  const hasGrouped =
    Object.prototype.hasOwnProperty.call(dto, "featured") ||
    Object.prototype.hasOwnProperty.call(dto, "upcoming");

  if (hasList === hasGrouped) {
    throw new InvalidLandingActivitiesError("INVALID_PAYLOAD");
  }

  if (hasList) {
    if (!Array.isArray(dto.activities)) {
      throw new InvalidLandingActivitiesError("INVALID_PAYLOAD");
    }

    const rawItems = dto.activities;
    const validItems = mapList(rawItems);

    if (rawItems.length > 0 && validItems.length === 0) {
      throw new InvalidLandingActivitiesError("NO_USABLE_ITEMS");
    }

    return {
      featured: [],
      upcoming: validItems.slice(0, 5),
    };
  }

  const featuredValue = dto.featured;
  const upcomingValue = dto.upcoming;

  if (
    (featuredValue != null && !Array.isArray(featuredValue)) ||
    (upcomingValue != null && !Array.isArray(upcomingValue))
  ) {
    throw new InvalidLandingActivitiesError("INVALID_PAYLOAD");
  }

  const rawFeatured = featuredValue ?? [];
  const rawUpcoming = upcomingValue ?? [];
  const validFeatured = mapList(rawFeatured);
  const validUpcoming = mapList(rawUpcoming);
  const rawCount = rawFeatured.length + rawUpcoming.length;
  const validCount = validFeatured.length + validUpcoming.length;

  if (rawCount > 0 && validCount === 0) {
    throw new InvalidLandingActivitiesError("NO_USABLE_ITEMS");
  }

  return {
    featured: validFeatured.slice(0, 2),
    upcoming: validUpcoming.slice(0, 3),
  };
}

export function hasActivities(collection: LandingActivities): boolean {
  return collection.featured.length > 0 || collection.upcoming.length > 0;
}
