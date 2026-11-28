import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServiceHub } from "@/features/services/components/ServiceHub";
import { HUB_CONTENT } from "@/features/services/config/content";
import type { HubService } from "@/features/services/services/hub.service";
import type { UniversityService } from "@/features/services/types/service";
import { updateDb } from "@/mocks/db/store";
import { expectNoA11yViolations, renderWithProviders, signInAs } from "../../../../tests/test-utils";

const services: UniversityService[] = [
  { id: "1", name: "Moodle", description: "Courses", href: "https://moodle.hcmus.edu.vn/", icon: { src: "/images/services/moodle.png", alt: "" }, displayOrder: 1, isActive: true, version: 1 },
  { id: "2", name: "Student Portal", description: null, href: "https://portal.hcmus.edu.vn/", icon: { src: "/images/services/portal.png", alt: "" }, displayOrder: 2, isActive: true, version: 1 },
];

describe("ServiceHub", () => {
  it("shows a loading skeleton, then every service as a new-tab link", async () => {
    const { container } = renderWithProviders(<ServiceHub service={{ listServices: async () => services }} />);
    expect(screen.getByRole("status", { name: "Loading university services" })).toBeInTheDocument();

    const moodle = await screen.findByRole("link", { name: "Moodle (opens in a new tab)" });
    expect(moodle).toHaveAttribute("href", "https://moodle.hcmus.edu.vn/");
    expect(moodle).toHaveAttribute("target", "_blank");
    expect(moodle).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Courses")).toBeInTheDocument();
    expect(screen.getAllByRole("link").map((l) => l.getAttribute("href"))).toEqual([
      "https://moodle.hcmus.edu.vn/",
      "https://portal.hcmus.edu.vn/",
    ]);
    await expectNoA11yViolations(container);
  });

  it("shows the empty state when nothing is configured (UC-07 A1)", async () => {
    renderWithProviders(<ServiceHub service={{ listServices: async () => [] }} />);
    expect(await screen.findByText(HUB_CONTENT.emptyTitle)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows a retryable error (UC-07 A4)", async () => {
    const listServices = vi.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce(services);
    const service: HubService = { listServices };
    renderWithProviders(<ServiceHub service={service} />);

    expect(await screen.findByText(HUB_CONTENT.errorTitle)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: HUB_CONTENT.retryLabel }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Moodle (opens in a new tab)" })).toBeInTheDocument());
    expect(listServices).toHaveBeenCalledTimes(2);
  });
  it("shows the forbidden view when the account may not read the hub", async () => {
    // Through the MSW hub handlers: the student role lost hub.services.read, so GET /hub/services is 403.
    updateDb((db) => {
      db.rolePermissions["role-student"] = db.rolePermissions["role-student"].filter((c) => c !== "hub.services.read");
    });
    signInAs("student1@example.invalid");
    const { container } = renderWithProviders(<ServiceHub />, { route: "/services" });
    expect(await screen.findByText("You don't have permission to view this page")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /opens in a new tab/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to my dashboard" })).toHaveAttribute("href", "/student/dashboard");
    await expectNoA11yViolations(container);
  });

  it("loads the seeded services through MSW for a signed-in user", async () => {
    signInAs("manager1@example.invalid");
    renderWithProviders(<ServiceHub />, { route: "/services" });
    expect(await screen.findByRole("link", { name: "Moodle (opens in a new tab)" })).toHaveAttribute(
      "href",
      "https://courses.ctda.hcmus.edu.vn/",
    );
    expect(screen.getAllByRole("link", { name: /opens in a new tab/ })).toHaveLength(6);
  });
});
