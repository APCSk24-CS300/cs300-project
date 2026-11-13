import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LANDING_NAV_LINKS } from "@/features/landing/config/nav";
import type { RoleCode } from "@/libs/roles";
import {
  createAuthContextValue,
  createSessionUser,
} from "../../../tests/fixtures";
import { renderWithAuth } from "../../../tests/test-utils";

const scrollMocks = vi.hoisted(() => ({
  scrollToSection: vi.fn(),
  useHashScroll: vi.fn(),
  useScrollSpy: vi.fn(),
}));

vi.mock("@/libs/scroll", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/libs/scroll")>();

  return {
    ...actual,
    scrollToSection: scrollMocks.scrollToSection,
    useHashScroll: scrollMocks.useHashScroll,
    useScrollSpy: scrollMocks.useScrollSpy,
  };
});

const originalRequestAnimationFrame = window.requestAnimationFrame;

function guestAuth() {
  return createAuthContextValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
}

function renderHeader(value = guestAuth()) {
  return renderWithAuth(<SiteHeader links={LANDING_NAV_LINKS} />, value);
}

function desktopNavigation() {
  return screen.getByRole("navigation", { name: "Primary" });
}

function desktopLinks() {
  const nav = desktopNavigation();
  const list = nav.querySelector("ul");

  if (!list) {
    throw new Error("Desktop navigation list was not found");
  }

  return within(list).getAllByRole("link");
}

async function openMobileMenu() {
  const trigger = screen.getByRole("button", {
    name: "Open navigation menu",
  });

  await userEvent.setup().click(trigger);

  const dialog = document.querySelector("dialog");

  if (!dialog) {
    throw new Error("Mobile navigation dialog was not found");
  }

  await waitFor(() => expect(dialog.open).toBe(true));

  return { dialog, trigger };
}

beforeEach(() => {
  scrollMocks.useScrollSpy.mockReturnValue("home");
  window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  }) as typeof window.requestAnimationFrame;
});

afterEach(() => {
  window.requestAnimationFrame = originalRequestAnimationFrame;
  document.body.style.overflow = "";
});

describe("SiteHeader", () => {
  it("renders the guest desktop baseline", () => {
    renderHeader();

    expect(
      screen.getByRole("link", { name: "myHCMUS home" }),
    ).toBeInTheDocument();
    expect(desktopLinks()).toHaveLength(5);
    expect(desktopLinks().map((link) => link.textContent)).toEqual(
      LANDING_NAV_LINKS.map((link) => link.label),
    );
    expect(screen.getByRole("link", { name: "Log In" })).toHaveAttribute(
      "href",
      "/login?redirectTo=%2F",
    );
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it.each([
    ["student", "/student/dashboard"],
    ["organizer", "/organizer/dashboard"],
    ["admin", "/admin/dashboard"],
  ] satisfies [RoleCode, string][])(
    "shows the %s dashboard path when authenticated",
    (role, dashboardPath) => {
      renderHeader(
        createAuthContextValue({
          user: createSessionUser(role),
          isAuthenticated: true,
          isLoading: false,
        }),
      );

      expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
        "href",
        dashboardPath,
      );
      expect(screen.queryByText("Log In")).not.toBeInTheDocument();
    },
  );

  it("reserves a loading placeholder without flashing Dashboard", () => {
    renderHeader(
      createAuthContextValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      }),
    );

    expect(
      screen.getByRole("status", { name: "Checking sign-in status" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Log In")).not.toBeInTheDocument();
  });

  it("marks the active desktop section with a non-color cue", () => {
    scrollMocks.useScrollSpy.mockReturnValue("activities");

    renderHeader();

    const activeLink = desktopLinks().find(
      (link) => link.textContent === "Activities",
    );

    expect(activeLink).toHaveAttribute("aria-current", "location");
    expect(activeLink).toHaveClass("border-primary", "font-semibold");
  });

  it("preserves the active section in the login return path", () => {
    scrollMocks.useScrollSpy.mockReturnValue("services");

    renderHeader();

    expect(screen.getByRole("link", { name: "Log In" })).toHaveAttribute(
      "href",
      "/login?redirectTo=%2F%23services",
    );
  });

  it("traps focus, closes with Escape, restores focus, and unlocks scroll", async () => {
    renderHeader();
    const { dialog, trigger } = await openMobileMenu();
    const closeButton = within(dialog).getByRole("button", {
      name: "Close navigation menu",
    });

    await waitFor(() => expect(document.activeElement).toBe(closeButton));
    expect(document.body.style.overflow).toBe("hidden");

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    last.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    first.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(dialog, { key: "Escape" });

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on backdrop click and restores focus to the trigger", async () => {
    renderHeader();
    const { dialog, trigger } = await openMobileMenu();

    fireEvent.click(dialog);

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(document.activeElement).toBe(trigger);
  });

  it("closes after section selection and focuses the selected section", async () => {
    const user = userEvent.setup();
    const section = document.createElement("section");
    section.id = "activities";
    section.tabIndex = -1;
    document.body.append(section);

    renderHeader();
    const { dialog } = await openMobileMenu();

    await user.click(
      within(dialog).getByRole("link", { name: "Activities" }),
    );

    expect(scrollMocks.scrollToSection).toHaveBeenCalledWith("activities");
    await waitFor(() => expect(dialog.open).toBe(false));
    expect(document.activeElement).toBe(section);

    section.remove();
  });
});
