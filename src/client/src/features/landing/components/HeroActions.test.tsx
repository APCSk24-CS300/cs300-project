import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { HERO_CONTENT } from "@/features/landing/config/hero";
import { HeroActions } from "@/features/landing/components/HeroActions";
import type { RoleCode } from "@/libs/roles";
import { createAuthContextValue, createSessionUser } from "../../../../tests/fixtures";
import { renderWithAuth } from "../../../../tests/test-utils";

const scrollMocks = vi.hoisted(() => ({
  scrollToSection: vi.fn(),
}));

vi.mock("@/libs/scroll", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/libs/scroll")>();

  return {
    ...actual,
    scrollToSection: scrollMocks.scrollToSection,
  };
});

describe("HeroActions", () => {
  it("sends guests to login and scrolls to the configured activities section", async () => {
    const user = userEvent.setup();

    renderWithAuth(
      <HeroActions activitiesHref="#activities" />,
      createAuthContextValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }),
    );

    expect(
      screen.getByRole("link", { name: HERO_CONTENT.primaryCta }),
    ).toHaveAttribute("href", "/login");

    await user.click(
      screen.getByRole("button", { name: HERO_CONTENT.secondaryCta }),
    );

    expect(scrollMocks.scrollToSection).toHaveBeenCalledWith("activities");
  });

  it("keeps the guest-safe login path while auth is loading", () => {
    renderWithAuth(
      <HeroActions activitiesHref="#activities" />,
      createAuthContextValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      }),
    );

    expect(
      screen.getByRole("link", { name: HERO_CONTENT.primaryCta }),
    ).toHaveAttribute("href", "/login");
  });

  it.each([
    ["student", "/student/dashboard"],
    ["organizer", "/organizer/dashboard"],
    ["admin", "/admin/dashboard"],
  ] satisfies [RoleCode, string][])(
    "sends authenticated %s users to %s",
    (role, dashboardPath) => {
      const user = createSessionUser(role);

      renderWithAuth(
        <HeroActions activitiesHref="#activities" />,
        createAuthContextValue({
          user,
          isAuthenticated: true,
          isLoading: false,
        }),
      );

      expect(
        screen.getByRole("link", { name: HERO_CONTENT.primaryCta }),
      ).toHaveAttribute("href", dashboardPath);
    },
  );
});
