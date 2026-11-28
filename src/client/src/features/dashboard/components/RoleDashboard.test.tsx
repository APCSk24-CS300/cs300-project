import { describe, expect, it } from "vitest";
import { RoleDashboard } from "@/features/dashboard";
import { DASHBOARD_SECTIONS } from "@/features/dashboard/config/dashboard-sections";
import { NAVIGATION } from "@/libs/navigation";
import { ROLE_CODES, ROLE_LABEL, type RoleCode } from "@/libs/roles";
import { expectNoA11yViolations, render, screen, within } from "../../../../tests/test-utils";

const user = (role: RoleCode) => ({
  fullName: `Test ${role}`,
  email: `${role}@example.invalid`,
  role,
  studentNumber: role === "student" ? "23127001" : null,
  faculty: role === "student" ? { name: "Computer and Information Technology field" } : null,
});

describe("RoleDashboard (UC-32 draft, FR-025)", () => {
  it.each(ROLE_CODES)("shows greeting, account details, shortcuts and unavailable summaries for %s", async (role) => {
    const { container } = render(<RoleDashboard user={user(role)} />);
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText(`Welcome, Test ${role}`)).toBeInTheDocument();
    expect(screen.getByText(`${role}@example.invalid`)).toBeInTheDocument();
    expect(screen.getByText(ROLE_LABEL[role])).toBeInTheDocument();
    if (role === "student") {
      expect(screen.getByText("23127001")).toBeInTheDocument();
      expect(screen.getByText("Computer and Information Technology field")).toBeInTheDocument();
    }

    const shortcuts = within(screen.getByRole("region", { name: "Shortcuts" }));
    for (const item of NAVIGATION[role].filter((i) => i.id !== "dashboard")) {
      expect(shortcuts.getByText(item.label)).toBeInTheDocument();
      if (item.status === "available") {
        expect(shortcuts.getByRole("link", { name: new RegExp(item.label) })).toHaveAttribute("href", item.href);
      }
    }
    expect(shortcuts.queryAllByRole("link")).toHaveLength(
      NAVIGATION[role].filter((i) => i.id !== "dashboard" && i.status === "available").length,
    );

    const overview = screen.getByRole("region", { name: "Overview" });
    expect(within(overview).getAllByText("Not yet available")).toHaveLength(DASHBOARD_SECTIONS[role].length);
    expect(overview.textContent).not.toMatch(/\d/);
    await expectNoA11yViolations(container);
  });
});
