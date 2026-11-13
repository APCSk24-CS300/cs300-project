import { beforeEach, describe, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ActivitiesSection } from "@/features/activities/components/ActivitiesSection";
import { ServicesSection } from "@/features/landing/components/ServicesSection";
import { ACTIVITIES_SECTION } from "@/features/activities/config";
import { FOOTER_CONTENT } from "@/features/landing/config/footer";
import { LANDING_NAV_LINKS } from "@/features/landing/config/nav";
import { createActivity, createAuthContextValue, createLandingActivities, createSessionUser } from "../../../../tests/fixtures";
import {
  expectNoA11yViolations,
  renderWithAuth,
  renderWithProviders,
} from "../../../../tests/test-utils";

const activityMocks = vi.hoisted(() => ({
  getLandingActivities: vi.fn(),
}));

vi.mock("@/features/activities/services/activity.service.factory", () => ({
  createActivityService: () => activityMocks,
}));

beforeEach(() => {
  activityMocks.getLandingActivities.mockReset();
});

describe("landing accessibility", () => {
  it("has no critical violations in the guest header and footer", async () => {
    const { container } = renderWithAuth(
      <>
        <SiteHeader links={LANDING_NAV_LINKS} />
        <main>
          <h1>myHCMUS</h1>
        </main>
        <SiteFooter content={FOOTER_CONTENT} />
      </>,
      createAuthContextValue(),
    );

    await expectNoA11yViolations(container);
  });

  it("has no critical violations in guest and authenticated services", async () => {
    const guest = renderWithAuth(
      <ServicesSection />,
      createAuthContextValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }),
    );

    await expectNoA11yViolations(guest.container);
    guest.unmount();

    const authenticated = renderWithAuth(
      <ServicesSection />,
      createAuthContextValue({
        user: createSessionUser("student"),
        isAuthenticated: true,
        isLoading: false,
      }),
    );

    await expectNoA11yViolations(authenticated.container);
  });

  it("has no critical violations in activity success, empty, and error states", async () => {
    activityMocks.getLandingActivities.mockResolvedValue(
      createLandingActivities({
        featured: [createActivity({ id: "a-1", title: "Activity One" })],
        upcoming: [createActivity({ id: "a-2", title: "Activity Two" })],
      }),
    );

    const success = renderWithProviders(<ActivitiesSection />);
    await screen.findByTestId("activity-grid");
    await expectNoA11yViolations(success.container);
    success.unmount();

    activityMocks.getLandingActivities.mockResolvedValue(
      createLandingActivities({ featured: [], upcoming: [] }),
    );

    const empty = renderWithProviders(<ActivitiesSection />);
    await screen.findByText(ACTIVITIES_SECTION.empty.title);
    await expectNoA11yViolations(empty.container);
    empty.unmount();

    activityMocks.getLandingActivities.mockRejectedValue(new Error("boom"));

    const error = renderWithProviders(<ActivitiesSection />);
    await screen.findByText(ACTIVITIES_SECTION.error.title);
    await expectNoA11yViolations(error.container);
  });
});
