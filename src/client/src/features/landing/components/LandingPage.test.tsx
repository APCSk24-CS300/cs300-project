import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { LandingPage } from "@/features/landing/components/LandingPage";
import { HERO_CONTENT } from "@/features/landing/config/hero";
import { createActivity, createAuthContextValue, createLandingActivities } from "../../../../tests/fixtures";
import { renderWithAuth } from "../../../../tests/test-utils";

const activityMocks = vi.hoisted(() => ({
  getLandingActivities: vi.fn(),
}));

vi.mock("@/features/activities/services/activity.service.factory", () => ({
  createActivityService: () => activityMocks,
}));

beforeEach(() => {
  activityMocks.getLandingActivities.mockReset();
  activityMocks.getLandingActivities.mockResolvedValue(
    createLandingActivities({
      featured: [
        createActivity({ id: "f-1", title: "Featured One" }),
        createActivity({ id: "f-2", title: "Featured Two" }),
      ],
      upcoming: [
        createActivity({ id: "u-1", title: "Upcoming One" }),
        createActivity({ id: "u-2", title: "Upcoming Two" }),
        createActivity({ id: "u-3", title: "Upcoming Three" }),
      ],
    }),
  );
});

describe("LandingPage", () => {
  it("renders the six sections in order with one h1 and valid landmarks", async () => {
    const { container } = renderWithAuth(
      <LandingPage />,
      createAuthContextValue(),
    );

    expect(await screen.findByTestId("activity-grid")).toBeInTheDocument();

    const sectionIds = Array.from(
      container.querySelectorAll("main > section[id], footer[id]"),
    ).map((element) => element.id);

    expect(sectionIds).toEqual([
      "home",
      "about",
      "activities",
      "services",
      "help",
      "contact",
    ]);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        name: HERO_CONTENT.headline,
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { level: 3 }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Log In" })).toBeInTheDocument();
  });
});
