import { describe, expect, it, vi } from "vitest";
import { api } from "@/libs/api-client";
import {
  RealActivityService,
  type ActivityService,
} from "@/features/activities/services/activity.service";
import { MockActivityService } from "@/features/activities/services/mock.activity.service";
import { mapLandingActivitiesDTO } from "@/features/activities/mappers/activity.mapper";
import { ACTIVITY_FIXTURES } from "@/features/activities/services/activity.fixtures";
import type { LandingActivitiesResponseDTO } from "@/features/activities/types";
import { createActivityDTO } from "../../../../tests/fixtures";

vi.mock("@/libs/api-client", () => ({
  api: {
    get: vi.fn(),
  },
}));

const getMock = vi.mocked(api.get);

describe("RealActivityService", () => {
  it("requests the landing endpoint with the signal and maps the envelope", async () => {
    const signal = new AbortController().signal;
    getMock.mockResolvedValueOnce({
      data: {
        featured: [
          createActivityDTO({
            id: "featured-1",
            title: "Featured Activity",
          }),
        ],
        upcoming: [createActivityDTO({ id: "upcoming-1" })],
      },
    } as LandingActivitiesResponseDTO);

    const result = await new RealActivityService().getLandingActivities(signal);

    expect(getMock).toHaveBeenCalledWith("/activities/landing", { signal });
    expect(result.featured[0]).toMatchObject({
      id: "featured-1",
      title: "Featured Activity",
      href: "/activities/featured-1",
    });
    expect(result.upcoming[0].id).toBe("upcoming-1");
  });

  it("propagates request errors", async () => {
    const error = new Error("Network unavailable");
    getMock.mockRejectedValueOnce(error);

    await expect(
      new RealActivityService().getLandingActivities(),
    ).rejects.toBe(error);
  });

  it("turns an invalid response envelope into a mapper error", async () => {
    getMock.mockResolvedValueOnce({} as LandingActivitiesResponseDTO);

    await expect(
      new RealActivityService().getLandingActivities(),
    ).rejects.toMatchObject({
      name: "InvalidLandingActivitiesError",
      code: "INVALID_PAYLOAD",
    });
  });
});

describe("MockActivityService", () => {
  it.each([
    "success",
    "partial",
    "empty",
    "delay",
    "single-list",
    "long-content",
  ] as const)("matches the mapped %s fixture without environment variables", async (scenario) => {
    const service: ActivityService = new MockActivityService(scenario, 0);

    const result = await service.getLandingActivities();

    expect(result).toEqual(
      mapLandingActivitiesDTO(ACTIVITY_FIXTURES[scenario]),
    );
  });

  it("rejects the all-invalid scenario through the shared mapper", async () => {
    await expect(
      new MockActivityService("all-invalid", 0).getLandingActivities(),
    ).rejects.toMatchObject({
      name: "InvalidLandingActivitiesError",
      code: "NO_USABLE_ITEMS",
    });
  });

  it("rejects the error scenario", async () => {
    await expect(
      new MockActivityService("error", 0).getLandingActivities(),
    ).rejects.toThrow("Unable to load activities");
  });

  it("rejects with AbortError when the signal is aborted", async () => {
    const controller = new AbortController();
    const promise = new MockActivityService("success", 10).getLandingActivities(
      controller.signal,
    );

    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
  });
});
