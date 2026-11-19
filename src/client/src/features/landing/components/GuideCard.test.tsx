import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { GuideCard } from "@/features/landing/components/GuideCard";
import type { GuideEntry } from "@/features/landing/config/guides";
import { renderWithProviders } from "../../../../tests/test-utils";

const availableGuide: GuideEntry = {
  id: "getting-started",
  title: "GETTING STARTED",
  subtitle: "Learn the basics",
  href: "/help/getting-started",
  available: true,
};

const unavailableGuide: GuideEntry = {
  id: "faq",
  title: "FAQ",
  subtitle: "Common questions",
  href: "/help/faq",
  available: false,
};

describe("GuideCard", () => {
  it("renders an available guide as one whole-card link", () => {
    const { container } = renderWithProviders(
      <GuideCard guide={availableGuide} />,
    );

    const link = screen.getByRole("link", {
      name: /getting started learn the basics/i,
    });

    expect(link).toHaveAttribute("href", "/help/getting-started");
    expect(link).toHaveTextContent("GETTING STARTED");
    expect(link).toHaveTextContent("Learn the basics");
    expect(link).not.toHaveTextContent("Coming soon");
    expect(container.querySelectorAll("a")).toHaveLength(1);
  });

  it("renders an unavailable guide without a dead link", () => {
    const { container } = renderWithProviders(
      <GuideCard guide={unavailableGuide} />,
    );

    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container.querySelector("a")).toBeNull();
    expect(container.innerHTML).not.toContain("/help/faq");
  });
});
