import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout/AppShell";
import { NAVIGATION, getDashboardPath } from "@/libs/navigation";
import { ROLE_CODES, type RoleCode } from "@/libs/roles";
import { expectNoA11yViolations, render, screen } from "../../../tests/test-utils";

function renderShell(role: RoleCode, demoMode = false) {
  return render(
    <AppShell
      user={{ fullName: "Test User", email: "t@example.invalid", role }}
      homeHref={getDashboardPath(role)}
      navItems={NAVIGATION[role]}
      currentPath={getDashboardPath(role)}
      onLogout={vi.fn()}
      demoMode={demoMode}
    >
      <p>content</p>
    </AppShell>,
  );
}

describe("AppShell (FR-023, FR-027)", () => {
  it.each(ROLE_CODES)("has the same structure for %s and passes axe", async (role) => {
    const { container } = renderShell(role);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("content");
    expect(screen.getByRole("button", { name: /account menu/i })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it("has a skip link to main", () => {
    renderShell("student");
    expect(screen.getByRole("link", { name: /skip to main content/i })).toHaveAttribute("href", "#main");
  });

  it("opens and closes the mobile drawer with the toggle and Escape", async () => {
    renderShell("student");
    const toggle = screen.getByRole("button", { name: /open navigation/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", screen.getByRole("navigation", { name: "Main" }).id);
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: /close navigation/i, expanded: true })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: /open navigation/i })).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the Demo data badge only in mock mode", () => {
    const { unmount } = renderShell("manager", true);
    expect(screen.getByText("Demo data")).toBeInTheDocument();
    unmount();
    renderShell("manager", false);
    expect(screen.queryByText("Demo data")).not.toBeInTheDocument();
  });

  it("renders no navigation when there are no items (Set a new password)", () => {
    render(
      <AppShell user={{ fullName: "N", email: "n@x.invalid", role: "student" }} homeHref="/" navItems={[]} currentPath="/change-password" onLogout={vi.fn()}>
        <p>content</p>
      </AppShell>,
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open navigation/i })).not.toBeInTheDocument();
  });
});
