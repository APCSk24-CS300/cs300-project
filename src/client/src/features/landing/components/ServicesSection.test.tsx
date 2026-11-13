import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { ServicesSection } from "@/features/landing/components/ServicesSection";
import { SERVICES } from "@/features/landing/config/services";
import { createAuthContextValue } from "../../../../tests/fixtures";
import { renderWithProviders } from "../../../../tests/test-utils";

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: authMocks.useAuth,
}));

function cardCount(container: HTMLElement) {
  return container.querySelector("#services .grid")?.children.length ?? 0;
}

beforeEach(() => {
  authMocks.useAuth.mockReturnValue(createAuthContextValue());
});

describe("ServicesSection", () => {
  it("locks authenticated services for guests while keeping public links usable", () => {
    const { container } = renderWithProviders(<ServicesSection />);

    expect(screen.getByRole("heading", {
      name: "Quick access to essential university services",
    })).toBeInTheDocument();
    expect(cardCount(container)).toBe(SERVICES.length);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Moodle (opens in a new tab)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Student Portal (opens in a new tab)" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Tuition Payment/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /HCMUS Website/ }),
    ).not.toBeInTheDocument();

    const lockedCard = screen
      .getByText("Tuition Payment")
      .closest('[aria-hidden="true"]');

    expect(lockedCard).not.toBeNull();
    expect(lockedCard).toHaveAttribute("inert");
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
  });

  it("treats the loading state as locked but stable", () => {
    authMocks.useAuth.mockReturnValue(
      createAuthContextValue({ isLoading: true }),
    );

    const { container } = renderWithProviders(<ServicesSection />);

    expect(cardCount(container)).toBe(SERVICES.length);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(
      screen.getByText("Tuition Payment").closest('[aria-hidden="true"]'),
    ).not.toBeNull();
  });

  it("unlocks all configured services for authenticated users", () => {
    authMocks.useAuth.mockReturnValue(
      createAuthContextValue({
        user: {
          userId: 1,
          email: "student@hcmus.edu.vn",
          fullName: "Student",
          avatarUrl: null,
          permissions: [],
          role: "student",
          studentNumber: "22120001",
          facultyId: 1,
        },
        isAuthenticated: true,
        isLoading: false,
      }),
    );

    const { container } = renderWithProviders(<ServicesSection />);

    expect(cardCount(container)).toBe(SERVICES.length);
    expect(screen.getAllByRole("link")).toHaveLength(SERVICES.length);
    expect(container.querySelector("[inert]")).toBeNull();

    for (const service of SERVICES) {
      expect(
        screen.getByRole("link", {
          name: `${service.name} (opens in a new tab)`,
        }),
      ).toHaveAttribute("href", service.href);
    }
  });

  it("keeps the same number of cards between guest and authenticated states", () => {
    authMocks.useAuth.mockReturnValue(createAuthContextValue());

    const { container, rerender } = renderWithProviders(<ServicesSection />);
    const guestCount = cardCount(container);

    authMocks.useAuth.mockReturnValue(
      createAuthContextValue({
        user: {
          userId: 3,
          email: "admin@hcmus.edu.vn",
          fullName: "Admin",
          avatarUrl: null,
          permissions: [],
          role: "admin",
          studentNumber: null,
          facultyId: null,
        },
        isAuthenticated: true,
        isLoading: false,
      }),
    );

    rerender(<ServicesSection />);

    expect(cardCount(container)).toBe(guestCount);
    expect(screen.getAllByRole("link")).toHaveLength(SERVICES.length);
  });
});
