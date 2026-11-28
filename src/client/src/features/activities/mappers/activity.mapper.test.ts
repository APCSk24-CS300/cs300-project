import { describe, expect, it } from "vitest";
import {
  InvalidLandingActivitiesError,
  hasActivities,
  mapActivityDTO,
  mapLandingActivitiesDTO,
} from "@/features/activities/mappers/activity.mapper";
import type { RegistrationStatus } from "@/features/activities/types";
import { createActivityDTO } from "../../../../tests/fixtures";

function expectInvalidPayload(payload: unknown) {
  try {
    mapLandingActivitiesDTO(payload);
    throw new Error("Expected mapper to reject the payload");
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidLandingActivitiesError);
    expect((error as InvalidLandingActivitiesError).code).toBe(
      "INVALID_PAYLOAD",
    );
  }
}

describe("mapActivityDTO", () => {
  it("maps required, optional, status, timezone, and href fields", () => {
    const dto = createActivityDTO({
      id: "act/001 ?",
      title: "  Mixed CASE Title  ",
      image_url: null,
      categories: [" Academic ", "", "Science"],
      location: "  ",
      registration_status: "closed",
    });

    const activity = mapActivityDTO(dto);

    expect(activity).not.toBeNull();
    expect(activity).toMatchObject({
      id: "act/001 ?",
      title: "  Mixed CASE Title  ",
      imageUrl: null,
      categories: ["Academic", "Science"],
      location: null,
      registrationStatus: "closed",
      href: "/activities/act%2F001%20%3F",
    });
    expect(activity?.startTime.toISOString()).toBe(
      "2026-10-17T01:00:00.000Z",
    );
  });

  it.each([
    ["open", "open"],
    ["upcoming", "upcoming"],
    ["closed", "closed"],
  ] satisfies [RegistrationStatus, RegistrationStatus][])(
    "preserves the %s registration status",
    (status, expected) => {
      expect(
        mapActivityDTO(createActivityDTO({ registration_status: status }))
          ?.registrationStatus,
      ).toBe(expected);
    },
  );

  it.each([
    ["a missing id", { id: "" }],
    ["a blank title", { title: "   " }],
    ["a timestamp without a timezone", { start_time: "2026-10-17T08:00:00" }],
    ["an invalid timestamp", { start_time: "not-a-date+07:00" }],
    ["a reversed interval", { end_time: "2026-10-17T07:00:00+07:00" }],
    ["an unknown status", { registration_status: "full" }],
  ])("rejects %s", (_label, overrides) => {
    expect(
      mapActivityDTO(
        createActivityDTO(overrides as Parameters<typeof createActivityDTO>[0]),
      ),
    ).toBeNull();
  });

  it("rejects non-object records", () => {
    expect(mapActivityDTO(null)).toBeNull();
    expect(mapActivityDTO("activity")).toBeNull();
    expect(mapActivityDTO([])).toBeNull();
  });
});

describe("mapLandingActivitiesDTO", () => {
  it("filters invalid items before applying grouped caps", () => {
    const invalid = createActivityDTO({ id: "", start_time: "invalid" });
    const first = createActivityDTO({ id: "act-a", title: "First" });
    const second = createActivityDTO({ id: "act-b", title: "Second" });
    const third = createActivityDTO({ id: "act-c", title: "Third" });
    const upcoming = [
      createActivityDTO({ id: "up-1" }),
      createActivityDTO({ id: "up-2" }),
      createActivityDTO({ id: "up-3" }),
      createActivityDTO({ id: "up-4" }),
    ];

    const result = mapLandingActivitiesDTO({
      featured: [invalid, first, second, third],
      upcoming,
    });

    expect(result.featured.map((activity) => activity.id)).toEqual([
      "act-a",
      "act-b",
    ]);
    expect(result.upcoming.map((activity) => activity.id)).toEqual([
      "up-1",
      "up-2",
      "up-3",
    ]);
    expect(result.featured[0].title).toBe("First");
  });

  it("maps a single list into five upcoming activities", () => {
    const activities = Array.from({ length: 6 }, (_, index) =>
      createActivityDTO({ id: `act-${index + 1}` }),
    );

    const result = mapLandingActivitiesDTO({ activities });

    expect(result.featured).toEqual([]);
    expect(result.upcoming).toHaveLength(5);
    expect(result.upcoming.map((activity) => activity.id)).toEqual([
      "act-1",
      "act-2",
      "act-3",
      "act-4",
      "act-5",
    ]);
  });

  it("treats a missing group as empty", () => {
    const result = mapLandingActivitiesDTO({
      featured: [createActivityDTO()],
    });

    expect(result.featured).toHaveLength(1);
    expect(result.upcoming).toEqual([]);
  });

  it("accepts an explicitly empty payload", () => {
    const result = mapLandingActivitiesDTO({ featured: [], upcoming: [] });

    expect(result).toEqual({ featured: [], upcoming: [] });
    expect(hasActivities(result)).toBe(false);
  });

  it.each([
    ["both shapes", { activities: [], featured: [] }],
    ["neither shape", {}],
    ["a non-array list", { activities: "invalid" }],
    ["a non-array group", { featured: "invalid" }],
  ])("rejects %s", (_label, payload) => {
    expectInvalidPayload(payload);
  });

  it("throws NO_USABLE_ITEMS when no record survives filtering", () => {
    expect(() =>
      mapLandingActivitiesDTO({
        featured: [
          createActivityDTO({ id: "" }),
          createActivityDTO({ start_time: "invalid" }),
        ],
        upcoming: [createActivityDTO({ end_time: "2026-10-17T07:00:00+07:00" })],
      }),
    ).toThrowError(InvalidLandingActivitiesError);

    try {
      mapLandingActivitiesDTO({
        featured: [createActivityDTO({ id: "" })],
        upcoming: [],
      });
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidLandingActivitiesError);
      expect((error as InvalidLandingActivitiesError).code).toBe(
        "NO_USABLE_ITEMS",
      );
    }
  });

  it("rejects a non-object payload", () => {
    expectInvalidPayload(null);
    expectInvalidPayload([]);
  });
});
