import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { ActivitiesSection } from "@/features/activities/components/ActivitiesSection";
import { ACTIVITIES_SECTION } from "@/features/activities/config";
import type { LandingActivities } from "@/features/activities/types";
import { createActivity, createLandingActivities } from "../../../../tests/fixtures";
import { renderWithProviders } from "../../../../tests/test-utils";

const activityMocks = vi.hoisted(() => ({
  getLandingActivities: vi.fn(),
}));

vi.mock("@/features/activities/services/activity.service.factory", () => ({
  createActivityService: () => activityMocks,
}));

function expectHeader() {
  expect(
    screen.getByRole("heading", {
      name: ACTIVITIES_SECTION.title,
      level: 2,
    }),
  ).toBeInTheDocument();
}

function expectAnnouncement(text: string) {
  expect(screen.getByRole("status")).toHaveTextContent(text);
}

const successData = createLandingActivities({
  featured: [
    createActivity({ id: "featured-a", title: "Featured A" }),
    createActivity({ id: "featured-b", title: "Featured B" }),
  ],
  upcoming: [
    createActivity({ id: "upcoming-a", title: "Upcoming A" }),
    createActivity({ id: "upcoming-b", title: "Upcoming B" }),
    createActivity({ id: "upcoming-c", title: "Upcoming C" }),
  ],
});

beforeEach(() => {
  activityMocks.getLandingActivities.mockReset();
});

describe("ActivitiesSection", () => {
  it("keeps the header visible while loading", () => {
    activityMocks.getLandingActivities.mockReturnValue(
      new Promise<LandingActivities>(() => undefined),
    );

    const { container } = renderWithProviders(<ActivitiesSection />);

    expectHeader();
    expect(screen.getByTestId("activities-skeleton")).toBeInTheDocument();
    expect(container.querySelector("[data-status]")).toHaveAttribute(
      "data-status",
      "loading",
    );
    expect(
      container.querySelector("[data-status]"),
    ).toHaveAttribute("aria-busy", "true");
    expectAnnouncement(ACTIVITIES_SECTION.loadingAnnouncement);
  });

  it("renders one success grid without duplicate content", async () => {
    activityMocks.getLandingActivities.mockResolvedValue(successData);

    renderWithProviders(<ActivitiesSection />);

    expectHeader();
    expect(await screen.findByTestId("activity-grid")).toBeInTheDocument();
    expect(screen.getByText("Featured A")).toBeInTheDocument();
    expect(screen.getAllByText("Featured A")).toHaveLength(1);
    expect(screen.queryByTestId("activities-skeleton")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expectAnnouncement(ACTIVITIES_SECTION.successAnnouncement);
    expect(document.activeElement).toBe(document.body);
  });

  it("keeps the header visible and announces the empty state", async () => {
    activityMocks.getLandingActivities.mockResolvedValue(
      createLandingActivities({ featured: [], upcoming: [] }),
    );

    const { container } = renderWithProviders(<ActivitiesSection />);

    expectHeader();
    expect(
      await screen.findByText(ACTIVITIES_SECTION.empty.title),
    ).toBeInTheDocument();
    expect(screen.getByText(ACTIVITIES_SECTION.empty.description)).toBeInTheDocument();
    expect(container.querySelector("[data-status]")).toHaveAttribute(
      "data-status",
      "empty",
    );
    expect(screen.queryByTestId("activity-grid")).not.toBeInTheDocument();
    expectAnnouncement(ACTIVITIES_SECTION.emptyAnnouncement);
  });

  it("renders the error state and retries into loading with heading focus", async () => {
    const user = userEvent.setup();
    activityMocks.getLandingActivities
      .mockRejectedValueOnce(new Error("boom"))
      .mockReturnValueOnce(new Promise<LandingActivities>(() => undefined));

    const { container } = renderWithProviders(<ActivitiesSection />);

    expectHeader();
    expect(
      await screen.findByText(ACTIVITIES_SECTION.error.title),
    ).toBeInTheDocument();
    expect(screen.getByText(ACTIVITIES_SECTION.error.description)).toBeInTheDocument();
    expectAnnouncement(ACTIVITIES_SECTION.errorAnnouncement);

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() =>
      expect(container.querySelector("[data-status]")).toHaveAttribute(
        "data-status",
        "loading",
      ),
    );
    expect(screen.getByTestId("activities-skeleton")).toBeInTheDocument();
    expectAnnouncement(ACTIVITIES_SECTION.loadingAnnouncement);
    expect(activityMocks.getLandingActivities).toHaveBeenCalledTimes(2);

    const heading = screen.getByRole("heading", {
      name: ACTIVITIES_SECTION.title,
      level: 2,
    });
    expect(document.activeElement).toBe(heading.parentElement?.parentElement);
  });
});
