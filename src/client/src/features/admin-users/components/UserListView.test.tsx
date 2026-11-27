import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { UserListView } from "@/features/admin-users/components/UserListView";
import { setMockFailures, updateDb } from "@/mocks/db/store";
import {
  act,
  expectNoA11yViolations,
  fireEvent,
  mockRouter,
  renderWithProviders,
  screen,
  signInAs,
  waitFor,
  within,
} from "../../../../tests/test-utils";

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

  it("updates the URL without updating the Router during render", async () => {
    // A state-backed stand-in for Next's Router, so updating it during another component's
    // render triggers React's real "Cannot update a component while rendering" warning.
    let setRouterUrl: (url: string) => void = () => undefined;
    function RouterProbe() {
      const [url, setUrl] = useState("/admin/users");
      setRouterUrl = setUrl;
      return <output data-testid="router-url">{url}</output>;
    }
    mockRouter.replace.mockImplementation((href: string) => setRouterUrl(href));
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);

    signInAs("admin@example.invalid");
    renderWithProviders(
      <>
        <RouterProbe />
        <UserListView />
      </>,
      { route: "/admin/users" },
    );
    await screen.findByText("Đặng Thu Mai");
    const search = screen.getByRole("searchbox", { name: /search/i });
    // Two queued updates in one batch: the second updater cannot be computed eagerly.
    act(() => {
      fireEvent.change(search, { target: { value: "a" } });
      fireEvent.change(search, { target: { value: "an" } });
    });

    await waitFor(() => expect(screen.getByTestId("router-url")).toHaveTextContent("/admin/users?search=an"));
    const renderUpdates = errors.mock.calls.filter((args) => String(args[0]).includes("Cannot update a component"));
    expect(renderUpdates).toEqual([]);
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
