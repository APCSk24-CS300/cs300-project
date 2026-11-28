import { describe, expect, it } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { ActivityCard } from "@/features/activities/components/ActivityCard";
import { createActivity } from "../../../../tests/fixtures";
import { renderWithProviders } from "../../../../tests/test-utils";

const placeholder = "/images/landing/activity-placeholder.png";

describe("ActivityCard", () => {
  it("uses one whole-card link with no nested link", () => {
    renderWithProviders(
      <ActivityCard activity={createActivity()} variant="featured" />,
    );

    const link = screen.getByRole("link");

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(within(link).queryByRole("link")).not.toBeInTheDocument();
    expect(within(link).getByText("View")).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/activities/act-001");
  });

  it("clamps featured titles to four lines and compact titles to three", () => {
    const activity = createActivity();

    const { rerender } = renderWithProviders(
      <ActivityCard activity={activity} variant="featured" />,
    );

    expect(
      screen.getByRole("heading", { name: activity.title }),
    ).toHaveClass("line-clamp-4");

    rerender(<ActivityCard activity={activity} variant="compact" />);

    expect(
      screen.getByRole("heading", { name: activity.title }),
    ).toHaveClass("line-clamp-3");
  });

  it("omits unavailable categories and location", () => {
    const activity = createActivity({ categories: [], location: null });

    renderWithProviders(
      <ActivityCard activity={activity} variant="featured" />,
    );

    expect(screen.queryByText("Academic")).not.toBeInTheDocument();
    expect(screen.queryByText("I.32, HCMUS")).not.toBeInTheDocument();
    expect(screen.getByText("17/10/2026, 8:00 - 10:00")).toBeInTheDocument();
  });

  it("renders only the first compact category", () => {
    renderWithProviders(
      <ActivityCard
        activity={createActivity({ categories: ["Academic", "Science"] })}
        variant="compact"
      />,
    );

    expect(screen.getByText("Academic")).toBeInTheDocument();
    expect(screen.queryByText("Academic, Science")).not.toBeInTheDocument();
  });

  it("falls back to the local placeholder when no image exists", () => {
    renderWithProviders(
      <ActivityCard
        activity={createActivity({ imageUrl: null })}
        variant="featured"
      />,
    );

    expect(
      screen.getByRole("img", { name: "Sample Activity cover image" }),
    ).toHaveAttribute("src", placeholder);
  });

  it("falls back after an image load error", () => {
    renderWithProviders(
      <ActivityCard
        activity={createActivity({ imageUrl: "/broken-image.png" })}
        variant="featured"
      />,
    );

    const image = screen.getByRole("img", {
      name: "Sample Activity cover image",
    });
    expect(image).toHaveAttribute("src", "/broken-image.png");

    fireEvent.error(image);

    expect(image).toHaveAttribute("src", placeholder);
  });

  it("shows status text with a non-color cue only on featured cards", () => {
    const activity = createActivity({ registrationStatus: "upcoming" });
    const { rerender } = renderWithProviders(
      <ActivityCard activity={activity} variant="featured" />,
    );

    const status = screen.getByText("Registration Upcoming");
    const badge = status.parentElement;

    expect(badge?.querySelector('[aria-hidden="true"]')).not.toBeNull();

    rerender(<ActivityCard activity={activity} variant="compact" />);

    expect(screen.queryByText("Registration Upcoming")).not.toBeInTheDocument();
  });

  it("renders multi-day dates with both dates", () => {
    renderWithProviders(
      <ActivityCard
        activity={createActivity({
          startTime: new Date("2026-10-17T08:00:00+07:00"),
          endTime: new Date("2026-10-18T10:00:00+07:00"),
        })}
        variant="featured"
      />,
    );

    expect(
      screen.getByText("17/10/2026 8:00 - 18/10/2026 10:00"),
    ).toBeInTheDocument();
  });
});
