import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServicesSection } from "@/features/landing/components/ServicesSection";
import { SERVICES, SERVICES_CONTENT } from "@/features/landing/config/services";
import type { AuthContextValue } from "@/features/auth/context/AuthContext";
import type { HubService } from "@/features/services/services/hub.service";
import type { UniversityService } from "@/features/services/types/service";
import { expectNoA11yViolations, renderWithAuth, renderWithProviders } from "../../../../tests/test-utils";

function serviceGrid(container: HTMLElement) {
  return container.querySelector<HTMLElement>("#services .grid");
}

const make = (i: number): UniversityService => ({
  id: String(i), name: `Service ${i}`, description: null, href: `https://s${i}.hcmus.edu.vn/`,
  icon: { src: "/images/services/default.svg", alt: "" }, displayOrder: i, isActive: true, version: 1,
});

const signedIn = {
  user: { userId: 1, email: "a@b.c", fullName: "A", role: "student", studentNumber: "1", facultyId: 1, avatarUrl: null, permissions: [] },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
} as unknown as AuthContextValue;

describe("ServicesSection for guests", () => {
  it("renders six display-only cards behind the login overlay", () => {
    const { container } = renderWithProviders(<ServicesSection />);
    const grid = serviceGrid(container);

    expect(SERVICES).toHaveLength(6);
    expect(grid?.children).toHaveLength(SERVICES.length);
    expect(grid?.querySelectorAll("a")).toHaveLength(0);
    expect(screen.getAllByRole("link")).toHaveLength(1);

    for (const service of SERVICES) {
      const card = screen.getByText(service.name).closest('[aria-hidden="true"]');
      expect(card).toHaveAttribute("inert");
    }
  });

  it("shows a translucent blurred overlay that leads to login", () => {
    renderWithProviders(<ServicesSection />);
    expect(screen.getByTestId("services-lock-overlay")).toHaveClass("pointer-events-none", "backdrop-blur-[2px]");
    expect(screen.getByRole("link", { name: SERVICES_CONTENT.loginMoreLabel })).toHaveAttribute(
      "href",
      "/login?redirectTo=%2F%23services",
    );
  });

  it("does not load hub data for guests", () => {
    const service: HubService = { listServices: vi.fn(async () => []) };
    renderWithProviders(<ServicesSection service={service} />);
    expect(service.listServices).not.toHaveBeenCalled();
  });
});

describe("ServicesSection for signed-in users", () => {
  it("shows up to six live links and a link to the hub", async () => {
    const service: HubService = { listServices: async () => [1, 2, 3, 4, 5, 6, 7].map(make) };
    const { container } = renderWithAuth(<ServicesSection service={service} />, signedIn);

    await screen.findByRole("link", { name: "Service 1 (opens in a new tab)" });
    expect(screen.getAllByRole("link", { name: /opens in a new tab/ })).toHaveLength(6);
    expect(screen.queryByText("Service 7")).not.toBeInTheDocument();
    expect(screen.queryByTestId("services-lock-overlay")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: SERVICES_CONTENT.seeAllLabel })).toHaveAttribute("href", "/services");
    await expectNoA11yViolations(container);
  });

  it("shows a compact retry when the hub fails", async () => {
    const listServices = vi.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce([make(1)]);
    renderWithAuth(<ServicesSection service={{ listServices }} />, signedIn);

    expect(await screen.findByRole("alert")).toHaveTextContent(SERVICES_CONTENT.errorLabel);
    await userEvent.click(screen.getByRole("button", { name: SERVICES_CONTENT.retryLabel }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Service 1 (opens in a new tab)" })).toBeInTheDocument());
  });
});
