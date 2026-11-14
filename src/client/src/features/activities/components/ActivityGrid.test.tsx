import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { ActivityGrid } from "@/features/activities/components/ActivityGrid";
import { createActivity } from "../../../../tests/fixtures";
import { renderWithProviders } from "../../../../tests/test-utils";

function activity(id: string, title: string) {
  return createActivity({ id, title, href: `/activities/${id}` });
}

describe("ActivityGrid", () => {
  it("renders two featured cards and three compact cards", () => {
    renderWithProviders(
      <ActivityGrid
        activities={{
          featured: [
            activity("f-1", "Featured One"),
            activity("f-2", "Featured Two"),
          ],
          upcoming: [
            activity("u-1", "Upcoming One"),
            activity("u-2", "Upcoming Two"),
            activity("u-3", "Upcoming Three"),
          ],
        }}
      />,
    );

    const grid = screen.getByTestId("activity-grid");

    expect(grid).toHaveAttribute("data-layout", "grouped");
    expect(grid).toHaveClass("lg:grid-cols-[2fr_1fr]");
    expect(screen.getAllByRole("link")).toHaveLength(5);
    expect(
      screen.getByRole("heading", { name: "Featured One" }),
    ).toHaveClass("line-clamp-4");
    expect(
      screen.getByRole("heading", { name: "Upcoming One" }),
    ).toHaveClass("line-clamp-3");
  });

  it("renders one featured card with compact cards", () => {
    renderWithProviders(
      <ActivityGrid
        activities={{
          featured: [activity("f-1", "Only Featured")],
          upcoming: [activity("u-1", "Compact One")],
        }}
      />,
    );

    expect(screen.getByTestId("activity-grid")).toHaveAttribute(
      "data-layout",
      "grouped",
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("lets a single featured card span the grid width", () => {
    renderWithProviders(
      <ActivityGrid
        activities={{
          featured: [activity("f-1", "Only Featured")],
          upcoming: [],
        }}
      />,
    );

    const grid = screen.getByTestId("activity-grid");

    expect(grid).toHaveAttribute("data-layout", "featured-only");
    expect(grid).toHaveClass("grid", "gap-5");
    expect(grid).not.toHaveClass("sm:grid-cols-2");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("places two featured cards side by side", () => {
    renderWithProviders(
      <ActivityGrid
        activities={{
          featured: [
            activity("f-1", "Featured One"),
            activity("f-2", "Featured Two"),
          ],
          upcoming: [],
        }}
      />,
    );

    const grid = screen.getByTestId("activity-grid");

    expect(grid).toHaveAttribute("data-layout", "featured-only");
    expect(grid).toHaveClass("sm:grid-cols-2");
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("renders up to five upcoming activities in a max-three-column grid", () => {
    renderWithProviders(
      <ActivityGrid
        activities={{
          featured: [],
          upcoming: Array.from({ length: 5 }, (_, index) =>
            activity(`u-${index + 1}`, `Upcoming ${index + 1}`),
          ),
        }}
      />,
    );

    const grid = screen.getByTestId("activity-grid");

    expect(grid).toHaveAttribute("data-layout", "upcoming-only");
    expect(grid).toHaveClass("lg:grid-cols-3");
    expect(screen.getAllByRole("link")).toHaveLength(5);
    expect(
      screen
        .getAllByRole("heading", { level: 3 })
        .every((heading) => heading.classList.contains("line-clamp-4")),
    ).toBe(true);
  });

  it("never renders a grid for an empty collection", () => {
    const { container } = renderWithProviders(
      <ActivityGrid activities={{ featured: [], upcoming: [] }} />,
    );

    expect(screen.queryByTestId("activity-grid")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
