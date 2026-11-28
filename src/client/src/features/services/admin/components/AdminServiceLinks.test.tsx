import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ADMIN_CONTENT, AdminServiceLinks } from "@/features/services/admin/components/AdminServiceLinks";
import type { AdminHubService } from "@/features/services/admin/services/admin-hub.service";
import { MockAdminHubService } from "@/features/services/admin/services/mock.admin-hub.service";
import { mockServiceLinkStore } from "@/features/services/services/mock.store";
import { ApiError } from "@/libs/api-client";
import { expectNoA11yViolations, renderWithProviders } from "../../../../../tests/test-utils";

function setup(service: AdminHubService = new MockAdminHubService(0)) {
  mockServiceLinkStore.reset();
  const user = userEvent.setup();
  const view = renderWithProviders(<AdminServiceLinks service={service} />);
  return { user, ...view };
}

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
    const form = screen.getByRole("form", { name: "Add service" });

    await user.type(within(form).getByLabelText("Name"), "E-learning");
    await user.type(within(form).getByLabelText("Address (URL)"), "javascript:alert(1)");
    await user.click(within(form).getByRole("button", { name: "Add service" }));
    expect(await within(form).findByText("Use a full http:// or https:// address")).toBeInTheDocument();

    await user.clear(within(form).getByLabelText("Address (URL)"));
    await user.type(within(form).getByLabelText("Address (URL)"), "https://elearning.hcmus.edu.vn");
    await user.click(within(form).getByRole("button", { name: "Add service" }));

    expect(await screen.findByText("Saved “E-learning”.")).toBeInTheDocument();
    expect(within(row("E-learning")).getByText("Active")).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("shows the backend's duplicate-name error on the name field", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: ADMIN_CONTENT.add }));
    const form = screen.getByRole("form", { name: "Add service" });
    await user.type(within(form).getByLabelText("Name"), "moodle");
    await user.type(within(form).getByLabelText("Address (URL)"), "https://m.edu");
    await user.click(within(form).getByRole("button", { name: "Add service" }));
    expect(await within(form).findByText("A service with this name already exists")).toBeInTheDocument();
  });

  it("edits a link", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Edit Moodle" }));
    const form = screen.getByRole("form", { name: "Save changes" });
    expect(within(form).getByLabelText("Name")).toHaveValue("Moodle");
    await user.clear(within(form).getByLabelText("Name"));
    await user.type(within(form).getByLabelText("Name"), "Moodle LMS");
    await user.click(within(form).getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Moodle LMS", { selector: "p" })).toBeInTheDocument();
  });

  it("asks before deactivating, then allows reactivating", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Deactivate Moodle" }));
    const confirm = screen.getByRole("group", { name: "Confirm deactivating Moodle" });
    await user.click(within(confirm).getByRole("button", { name: "Deactivate" }));
    await waitFor(() => expect(within(row("Moodle")).getByText("Inactive")).toBeInTheDocument());
    expect(mockServiceLinkStore.links.find((l) => l.name === "Moodle")?.isActive).toBe(false);

    await user.click(screen.getByRole("button", { name: "Reactivate Moodle" }));
    await waitFor(() => expect(within(row("Moodle")).getByText("Active")).toBeInTheDocument());
  });

  it("cancelling the confirmation changes nothing", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Deactivate Moodle" }));
    await user.click(within(screen.getByRole("group")).getByRole("button", { name: "Cancel" }));
    expect(within(row("Moodle")).getByText("Active")).toBeInTheDocument();
  });

  it("tells the admin to reload when someone else saved first (412)", async () => {
    const base = new MockAdminHubService(0);
    const service: AdminHubService = {
      listAll: (s) => base.listAll(s),
      create: (b) => base.create(b),
      update: vi.fn().mockRejectedValue(new ApiError(412, "stale", { currentVersion: 2 })),
      deactivate: vi.fn().mockRejectedValue(new ApiError(412, "stale", { currentVersion: 2 })),
    };
    const { user } = setup(service);
    await user.click(await screen.findByRole("button", { name: "Deactivate Moodle" }));
    await user.click(within(screen.getByRole("group")).getByRole("button", { name: "Deactivate" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(ADMIN_CONTENT.stale);
    expect(screen.getByRole("button", { name: ADMIN_CONTENT.reload })).toBeInTheDocument();
  });

  it("shows a retryable error when the list cannot load", async () => {
    const listAll = vi.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce([]);
    const { user } = setup({ listAll, create: vi.fn(), update: vi.fn(), deactivate: vi.fn() });
    await user.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByText("No service links yet")).toBeInTheDocument();
  });
});
