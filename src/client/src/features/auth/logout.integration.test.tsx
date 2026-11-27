import userEvent from "@testing-library/user-event";
import { act } from "react";
import { describe, expect, it } from "vitest";
import ProtectedLayout from "@/app/(protected)/layout";
import { api } from "@/libs/api-client";
import { mockDevTools } from "@/mocks/dev-tools";
import { setMockFailures } from "@/mocks/db/store";
import { TOKEN_STORAGE_KEY } from "@/libs/token-store";
import { SESSION_HINT_COOKIE, readHint, writeHint } from "@/libs/session-hint";
import { mockRouter, renderWithProviders, screen, signInAs, waitFor } from "../../../tests/test-utils";

/** Makes one authenticated API call through the shared client (exercises the session handlers). */
function ApiProbe() {
  return (
    <button type="button" onClick={() => void api.get("/admin/faculties").catch(() => undefined)}>
      call api
    </button>
  );
}

function renderDashboard(route = "/student/dashboard") {
  return renderWithProviders(
    <ProtectedLayout>
      <p>protected content</p>
    </ProtectedLayout>,
    { route },
  );
}

async function clickLogout() {
  await userEvent.click(await screen.findByRole("button", { name: /account menu/i }));
  await userEvent.click(screen.getByRole("menuitem", { name: /log out/i }));
}

const signedOut = () => window.localStorage.getItem(TOKEN_STORAGE_KEY) === null && readHint() === null;

describe("UC-02 log out and session end", () => {
  it("basic: logs out, clears token and hint, opens /login?reason=signed-out", async () => {
    signInAs("student1@example.invalid");
    renderDashboard();
    expect(await screen.findByText("protected content")).toBeInTheDocument();
    await clickLogout();
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/login?reason=signed-out"));
    expect(signedOut()).toBe(true);
    expect(mockRouter.replace).toHaveBeenCalledTimes(1); // M12: one redirect, reason kept
  });

  it("A2: an already-expired session logs out silently", async () => {
    signInAs("student1@example.invalid");
    renderDashboard();
    await screen.findByText("protected content");
    mockDevTools.expireSessions();
    await clickLogout();
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/login?reason=signed-out"));
    expect(signedOut()).toBe(true);
  });

  it("A3: an unreachable server still signs out locally and says so", async () => {
    signInAs("student1@example.invalid");
    renderDashboard();
    await screen.findByText("protected content");
    setMockFailures(["logout:network"]);
    await clickLogout();
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/login?reason=logout-unconfirmed"));
    expect(signedOut()).toBe(true);
  });

  it("A4: a protected page without a session never renders and goes to sign-in", async () => {
    renderDashboard("/student/dashboard");
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/login?redirectTo=%2Fstudent%2Fdashboard"),
    );
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("FR-018: a 401 on a later call returns to sign-in with the current path", async () => {
    signInAs("admin@example.invalid");
    renderWithProviders(
      <ProtectedLayout>
        <ApiProbe />
      </ProtectedLayout>,
      { route: "/admin/users?page=2" },
    );
    await screen.findByRole("button", { name: "call api" });
    mockDevTools.expireSessions();
    await userEvent.click(screen.getByRole("button", { name: "call api" }));
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/login?reason=expired&redirectTo=%2Fadmin%2Fusers"),
    );
    expect(signedOut()).toBe(true);
  });

  it("FR-018a / H3: a disabled account mid-session goes to /login?reason=disabled", async () => {
    signInAs("admin@example.invalid");
    renderWithProviders(
      <ProtectedLayout>
        <ApiProbe />
      </ProtectedLayout>,
      { route: "/admin/users" },
    );
    await screen.findByRole("button", { name: "call api" });
    mockDevTools.disable("admin@example.invalid");
    await userEvent.click(screen.getByRole("button", { name: "call api" }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/login?reason=disabled"));
    expect(signedOut()).toBe(true);
  });

  it("FR-018b / L1: logging out in another tab ends this tab without a server call", async () => {
    signInAs("student1@example.invalid");
    renderDashboard();
    await screen.findByText("protected content");
    await act(async () => {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.dispatchEvent(new StorageEvent("storage", { key: TOKEN_STORAGE_KEY, newValue: null }));
    });
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/login?reason=signed-out"));
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("FR-018c / H5: a stale hint without a token is cleared and causes no loop", async () => {
    writeHint({ role: "student", mustChangePassword: false, exp: Math.floor(Date.now() / 1000) + 600 });
    renderDashboard();
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/login?redirectTo=%2Fstudent%2Fdashboard"),
    );
    expect(document.cookie).not.toContain(`${SESSION_HINT_COOKIE}=e`);
    expect(readHint()).toBeNull();
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
  });
});
