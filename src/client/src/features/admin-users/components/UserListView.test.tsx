import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { UserListView } from "@/features/admin-users/components/UserListView";
import { setMockFailures, updateDb } from "@/mocks/db/store";
import { expectNoA11yViolations, mockRouter, renderWithProviders, screen, signInAs, waitFor, within } from "../../../../tests/test-utils";

async function setup() {
  signInAs("admin@example.invalid");
  const view = renderWithProviders(<UserListView />, { route: "/admin/users" });
  return view;
}

describe("UserListView (US5)", () => {
  it("shows a skeleton, then accounts newest first with role labels and status", async () => {
    const { container } = await setup();
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    await screen.findByText("Đặng Thu Mai");
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(7); // header + 6
    expect(within(rows[1]).getByText("Đặng Thu Mai")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it("A1: shows the empty state and clears the filters", async () => {
    await setup();
    await screen.findByText("Đặng Thu Mai");
    await userEvent.type(screen.getByRole("searchbox", { name: /search/i }), "zzz");
    expect(await screen.findByText("No accounts match")).toBeInTheDocument();
    expect(mockRouter.replace).toHaveBeenLastCalledWith("/admin/users?search=zzz", expect.anything());
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(7));
    expect(screen.getByRole("searchbox", { name: /search/i })).toHaveValue("");
  });

  it("filters by role", async () => {
    await setup();
    await screen.findByText("Đặng Thu Mai");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: /role/i }), "manager");
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(2));
    expect(screen.getByText("Trần Thị Bích")).toBeInTheDocument();
  });

  it("pages through results", async () => {
    updateDb((db) => {
      for (let i = 0; i < 9; i += 1) {
        db.users.push({ ...db.users[1], id: `user-x${i}`, email: `m${i}@example.invalid`, fullName: `Extra ${i}`, createdAt: `2026-08-0${i + 1}T00:00:00.000Z` });
      }
    });
    await setup();
    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(6));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
  });

  it("shows an error with retry", async () => {
    setMockFailures(["listUsers"]);
    await setup();
    expect(await screen.findByText("The accounts could not be loaded")).toBeInTheDocument();
    setMockFailures([]);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(7));
  });

  it("renders the no-permission view on 403", async () => {
    signInAs("manager1@example.invalid");
    renderWithProviders(<UserListView />, { route: "/admin/users" });
    expect(await screen.findByText(/don't have permission/i)).toBeInTheDocument();
  });
});
