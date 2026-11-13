import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { ServiceCard } from "@/features/landing/components/ServiceCard";
import { SERVICES } from "@/features/landing/config/services";
import { renderWithProviders } from "../../../../tests/test-utils";

const publicService = SERVICES[0];
const privateService = SERVICES[1];

describe("ServiceCard", () => {
  it("renders locked cards without a link, destination, or selection", () => {
    const { container } = renderWithProviders(
      <ServiceCard service={privateService} locked />,
    );

    const card = container.firstElementChild;

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container.querySelector("a")).toBeNull();
    expect(container.innerHTML).not.toContain(privateService.href);
    expect(card).toHaveAttribute("aria-hidden", "true");
    expect(card).toHaveAttribute("inert");
    expect(card).toHaveClass("select-none");
    expect(screen.getByText("Tuition Payment")).toBeInTheDocument();
    expect(screen.getByText("Access")).toBeInTheDocument();
  });

  it("renders an unlocked public service as an external whole-card link", () => {
    renderWithProviders(
      <ServiceCard service={publicService} locked={false} />,
    );

    const link = screen.getByRole("link", {
      name: "Moodle (opens in a new tab)",
    });

    expect(link).toHaveAttribute("href", publicService.href);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveTextContent("Moodle");
    expect(link).toHaveTextContent("Access");
  });

  it("renders an unavailable card without a dead link", () => {
    const { container } = renderWithProviders(
      <ServiceCard
        service={{ ...publicService, available: false }}
        locked={false}
      />,
    );

    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container.querySelector("a")).toBeNull();
    expect(container.innerHTML).not.toContain(publicService.href);
  });
});
