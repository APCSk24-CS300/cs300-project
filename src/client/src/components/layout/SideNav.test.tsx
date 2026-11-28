import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SideNav } from "@/components/layout/SideNav";
import { NAVIGATION } from "@/libs/navigation";
import { ROLE_CODES } from "@/libs/roles";
import { render, screen, within } from "../../../tests/test-utils";

describe("SideNav (FR-024)", () => {
  it.each(ROLE_CODES)("renders exactly the %s items and no other role's items", (role) => {
    render(<SideNav items={NAVIGATION[role]} currentPath={NAVIGATION[role][0].href} />);
    const labels = screen.getAllByRole("listitem").map((li) => within(li).getByText(/./, { selector: "a > span, span > span > span:last-child" }).textContent);
    expect(labels).toEqual(NAVIGATION[role].map((i) => i.label));
    for (const other of ROLE_CODES.filter((r) => r !== role)) {
      for (const item of NAVIGATION[other].filter((i) => !NAVIGATION[role].some((m) => m.label === i.label))) {
        expect(screen.queryByText(item.label)).not.toBeInTheDocument();
      }
    }
  });

  it("marks the current page and makes only available items links", () => {
    render(<SideNav items={NAVIGATION.administrator} currentPath="/admin/users/new" />);
    expect(screen.getByRole("link", { name: "User Management" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
    expect(screen.getAllByRole("link")).toHaveLength(
      NAVIGATION.administrator.filter((i) => i.status === "available").length,
    );
  });

  it("coming-soon items have no href, are aria-disabled, skipped by Tab and labelled", async () => {
    render(<SideNav items={NAVIGATION.student} currentPath="/student/dashboard" />);
    const calendar = screen.getByText("Calendar").closest("[aria-disabled]");
    expect(calendar).toHaveAttribute("aria-disabled", "true");
    expect(calendar?.closest("a")).toBeNull();
    const available = NAVIGATION.student.filter((i) => i.status === "available");
    expect(screen.getAllByText("Coming soon")).toHaveLength(NAVIGATION.student.length - available.length);

    // Tab visits only the available items, in order, then leaves the nav.
    for (const item of available) {
      await userEvent.tab();
      expect(screen.getByRole("link", { name: item.label })).toHaveFocus();
    }
    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });
});
