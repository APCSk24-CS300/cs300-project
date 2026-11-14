import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { ServicesSection } from "@/features/landing/components/ServicesSection";
import {
  SERVICES,
  SERVICES_CONTENT,
} from "@/features/landing/config/services";
import { renderWithProviders } from "../../../../tests/test-utils";

function serviceGrid(container: HTMLElement) {
  return container.querySelector<HTMLElement>("#services .grid");
}

describe("ServicesSection", () => {
  it("renders six display-only cards behind the login overlay", () => {
    const { container } = renderWithProviders(<ServicesSection />);
    const grid = serviceGrid(container);

    expect(SERVICES).toHaveLength(6);
    expect(grid).not.toBeNull();
    expect(grid?.children).toHaveLength(SERVICES.length);
    expect(grid?.querySelectorAll("a")).toHaveLength(0);
    expect(screen.getAllByRole("link")).toHaveLength(1);

    for (const service of SERVICES) {
      expect(screen.getByText(service.name)).toBeInTheDocument();

      const card = screen
        .getByText(service.name)
        .closest('[aria-hidden="true"]');

      expect(card).not.toBeNull();
      expect(card).toHaveAttribute("inert");
      expect(card).toHaveClass("pointer-events-none", "select-none");
      expect(container.innerHTML).not.toContain(service.href);
    }

    expect(screen.getByText("HCMUS Library")).toBeInTheDocument();
    expect(screen.getByText("IT Support")).toBeInTheDocument();
  });

  it("shows a translucent blurred overlay that leads to login", () => {
    renderWithProviders(<ServicesSection />);

    const overlay = screen.getByTestId("services-lock-overlay");

    expect(overlay).toHaveClass(
      "pointer-events-none",
      "bg-gradient-to-t",
      "backdrop-blur-[2px]",
    );

    expect(
      screen.getByRole("link", { name: SERVICES_CONTENT.loginMoreLabel }),
    ).toHaveAttribute("href", "/login?redirectTo=%2F%23services");
  });
});
