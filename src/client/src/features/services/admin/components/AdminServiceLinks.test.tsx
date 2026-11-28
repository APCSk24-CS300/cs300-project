import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { ADMIN_CONTENT, AdminServiceLinks } from "@/features/services/admin/components/AdminServiceLinks";
import { readDb, setMockFailures, updateDb } from "@/mocks/db/store";
import {
  expectNoA11yViolations,
  renderWithProviders,
  screen,
  signInAs,
  waitFor,
  within,
} from "../../../../../tests/test-utils";

// Talks to the MSW hub handlers (they answer like the backend); the mock DB is reset before each test.
// Scenario map: specs/005-integrate-hub/coverage.md (US3).
function setup() {
  signInAs("admin@example.invalid");
  const user = userEvent.setup();
  const view = renderWithProviders(<AdminServiceLinks />, { route: "/admin/services" });
  return { user, ...view };
}

const stored = (name: string) => readDb().serviceLinks.find((l) => l.name === name);

const row = (name: string) => screen.getByText(name, { selector: "p" }).closest("tr")!;

describe("AdminServiceLinks", () => {
  it("lists active and inactive links with their status", async () => {
    const { container } = setup();
    await screen.findByText("Moodle", { selector: "p" });
    expect(within(row("Moodle")).getByText("Active")).toBeInTheDocument();
    expect(within(row("HCMUS")).getByText("Inactive")).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it("adds a link after client-side validation", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: ADMIN_CONTENT.add }));
    const dialog = screen.getByRole("dialog", { name: ADMIN_CONTENT.add });
    expect(within(dialog).getByLabelText(/^name/i)).toHaveFocus();
    const form = within(dialog).getByRole("form", { name: "Add service" });

    await user.type(within(form).getByLabelText(/^name/i), "E-learning");
    await user.type(within(form).getByLabelText(/^address/i), "javascript:alert(1)");
    await user.click(within(form).getByRole("button", { name: "Add service" }));
    expect(await within(form).findByText("Use a full http:// or https:// address")).toBeInTheDocument();

    await user.clear(within(form).getByLabelText(/^address/i));
    await user.type(within(form).getByLabelText(/^address/i), "https://elearning.hcmus.edu.vn");
    await user.click(within(form).getByRole("button", { name: "Add service" }));

    expect(await screen.findByText("Saved “E-learning”.")).toBeInTheDocument();
    expect(within(row("E-learning")).getByText("Active")).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(stored("E-learning")).toMatchObject({ isActive: true, displayOrder: 8, version: 1 });
  });

  it("shows the backend's duplicate-name error on the name field", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: ADMIN_CONTENT.add }));
    const form = screen.getByRole("form", { name: "Add service" });
    await user.type(within(form).getByLabelText(/^name/i), " MOODLE ");
    await user.type(within(form).getByLabelText(/^address/i), "https://m.edu");
    await user.click(within(form).getByRole("button", { name: "Add service" }));
    expect(await within(form).findByText("A service with this name already exists")).toBeInTheDocument();
    expect(readDb().serviceLinks).toHaveLength(7);
  });

  it("edits a link", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Edit Moodle" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Moodle" });
    const form = within(dialog).getByRole("form", { name: "Save changes" });
    expect(within(form).getByLabelText(/^name/i)).toHaveValue("Moodle");
    await user.clear(within(form).getByLabelText(/^name/i));
    await user.type(within(form).getByLabelText(/^name/i), "Moodle LMS");
    await user.click(within(form).getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Moodle LMS", { selector: "p" })).toBeInTheDocument();
    expect(stored("Moodle LMS")).toMatchObject({ id: "1", version: 2 });
  });

  it("asks before deactivating, then allows reactivating", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Deactivate Moodle" }));
    const confirm = screen.getByRole("dialog", { name: "Deactivate Moodle?" });
    await user.click(within(confirm).getByRole("button", { name: "Deactivate" }));
    await waitFor(() => expect(within(row("Moodle")).getByText("Inactive")).toBeInTheDocument());
    expect(stored("Moodle")).toMatchObject({ isActive: false, version: 2 });
    expect(readDb().serviceLinks).toHaveLength(7); // never deleted

    await user.click(screen.getByRole("button", { name: "Reactivate Moodle" }));
    await waitFor(() => expect(within(row("Moodle")).getByText("Active")).toBeInTheDocument());
  });

  it("cancelling the confirmation changes nothing", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Deactivate Moodle" }));
    await user.click(within(screen.getByRole("dialog", { name: "Deactivate Moodle?" })).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(row("Moodle")).getByText("Active")).toBeInTheDocument();
    expect(stored("Moodle")).toMatchObject({ isActive: true, version: 1 });
  });

  it("tells the admin to reload when someone else saved first (412)", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Deactivate Moodle" }));
    // Another administrator saves Moodle after this list was loaded.
    updateDb((db) => {
      const moodle = db.serviceLinks.find((l) => l.name === "Moodle")!;
      moodle.description = "Changed elsewhere";
      moodle.version = 2;
    });
    await user.click(within(screen.getByRole("dialog", { name: "Deactivate Moodle?" })).getByRole("button", { name: "Deactivate" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(ADMIN_CONTENT.stale);
    expect(screen.getByRole("button", { name: ADMIN_CONTENT.reload })).toBeInTheDocument();
    expect(stored("Moodle")).toMatchObject({ isActive: true, version: 2 }); // not applied
  });

  it("shows a retryable error when the list cannot load", async () => {
    setMockFailures(["manageServiceLinks"]);
    const { user } = setup();
    const retry = await screen.findByRole("button", { name: "Try again" });
    setMockFailures([]);
    updateDb((db) => {
      db.serviceLinks = [];
    });
    await user.click(retry);
    expect(await screen.findByText("No service links yet")).toBeInTheDocument();
  });
  it("shows the forbidden view when the API answers 403", async () => {
    // The administrator role lost hub.services.manage (the API, not the UI, decides).
    updateDb((db) => {
      db.rolePermissions["role-administrator"] = db.rolePermissions["role-administrator"].filter((c) => c !== "hub.services.manage");
    });
    setup();
    expect(await screen.findByText("You don't have permission to view this page")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows the forbidden view when a change is refused with 403", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Deactivate Moodle" }));
    updateDb((db) => {
      db.rolePermissions["role-administrator"] = db.rolePermissions["role-administrator"].filter((c) => c !== "hub.services.manage");
    });
    await user.click(within(screen.getByRole("dialog", { name: "Deactivate Moodle?" })).getByRole("button", { name: "Deactivate" }));
    expect(await screen.findByText("You don't have permission to view this page")).toBeInTheDocument();
    expect(stored("Moodle")).toMatchObject({ isActive: true });
  });
});
