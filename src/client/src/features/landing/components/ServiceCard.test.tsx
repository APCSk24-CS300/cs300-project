import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { ServiceCard } from "@/features/landing/components/ServiceCard";
import { SERVICES } from "@/features/landing/config/services";
import { renderWithProviders } from "../../../../tests/test-utils";

const preview = SERVICES[1]!;
const live = { ...SERVICES[0]!, href: "https://moodle.hcmus.edu.vn/", description: "Courses" };

describe("ServiceCard", () => {
  it("renders locked cards without a link or selection", () => {
    const { container } = renderWithProviders(<ServiceCard service={live} locked />);
    const card = container.firstElementChild;

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container.querySelector("a")).toBeNull();
    expect(container.innerHTML).not.toContain(live.href);
    expect(card).toHaveAttribute("aria-hidden", "true");
    expect(card).toHaveAttribute("inert");
    expect(card).toHaveClass("select-none");
  });

  it("renders a preview without href as a picture only", () => {
    const { container } = renderWithProviders(<ServiceCard service={preview} />);
    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByText(preview.name)).toBeInTheDocument();
  });

  it("renders an unlocked service as an external whole-card link", () => {
    renderWithProviders(<ServiceCard service={live} />);
    const link = screen.getByRole("link", { name: "Moodle (opens in a new tab)" });

    expect(link).toHaveAttribute("href", live.href);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveTextContent("Access");
    expect(screen.queryByText("Courses")).not.toBeInTheDocument();
  });

  it("shows the description when asked", () => {
    renderWithProviders(<ServiceCard service={live} showDescription />);
    expect(screen.getByText("Courses")).toBeInTheDocument();
  });
});
