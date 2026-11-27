import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ProtectedLayout from "@/app/(protected)/layout";
import CreateAccountPage from "@/app/(protected)/admin/users/new/page";
import DashboardPage from "@/app/(protected)/student/dashboard/page";
import LoginForm from "@/features/auth/components/LoginForm";
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import type { RoleCode } from "@/libs/roles";
import { mockRouter, renderWithProviders, screen, signInAs, waitFor } from "../../tests/test-utils";

/**
 * SC-002 end to end on the mock, through the app's routes (lives in src/app so it can compose
 * several features without one feature importing another's internals, C-II).
 */
const ACCOUNTS: { role: RoleCode; label: string; email: string; dashboard: string }[] = [
  { role: "student", label: "Student", email: "e2e.student@example.invalid", dashboard: "/student/dashboard" },
  { role: "manager", label: "Manager", email: "e2e.manager@example.invalid", dashboard: "/manager/dashboard" },
  { role: "administrator", label: "Administrator", email: "e2e.admin@example.invalid", dashboard: "/admin/dashboard" },
];

async function logout(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: /account menu/i }));
  await user.click(screen.getByRole("menuitem", { name: /log out/i }));
  await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/login?reason=signed-out"));
}

async function signIn(user: ReturnType<typeof userEvent.setup>, email: string, password: string) {
  await user.type(await screen.findByLabelText(/email address/i), email);
  await user.type(screen.getByLabelText(/^password/i), password);
  await user.click(screen.getByRole("button", { name: /log in/i }));
}

describe("SC-002: create → log out → sign in → set a new password → dashboard", () => {
  it.each(ACCOUNTS)("works for a new $label account", async ({ role, label, email, dashboard }) => {
    const user = userEvent.setup();

    // 1. Administrator creates the account.
    signInAs("admin@example.invalid");
    const admin = renderWithProviders(
      <ProtectedLayout>
        <CreateAccountPage />
      </ProtectedLayout>,
      { route: "/admin/users/new" },
    );
    await user.type(await screen.findByLabelText(/^email/i), email);
    await user.type(screen.getByLabelText(/full name/i), `E2E ${label}`);
    await user.click(screen.getByRole("radio", { name: new RegExp(`^${label}`, "i") }));
    if (role === "student") {
      await user.type(screen.getByLabelText(/student number/i), "23127999");
      await user.selectOptions(await screen.findByRole("combobox", { name: /faculty/i }), "120");
    }
    await user.click(screen.getByRole("button", { name: "Review" }));
    const temporaryPassword = (await screen.findByTestId("generated-password")).textContent ?? "";
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("Account created")).toBeInTheDocument();

    // 2. Log out.
    await logout(user);
    admin.unmount();
    mockRouter.replace.mockClear();

    // 3. Sign in with the temporary password → "Set a new password".
    const login = renderWithProviders(<LoginForm />, { route: "/login" });
    await signIn(user, email, temporaryPassword);
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/change-password"));
    login.unmount();
    mockRouter.replace.mockClear();

    // 4. The dashboard is not reachable yet.
    const blocked = renderWithProviders(
      <ProtectedLayout>
        <DashboardPage />
      </ProtectedLayout>,
      { route: dashboard },
    );
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/change-password"));
    blocked.unmount();
    mockRouter.replace.mockClear();

    // 5. Set a new password → dashboard.
    const change = renderWithProviders(
      <ProtectedLayout>
        <ChangePasswordForm />
      </ProtectedLayout>,
      { route: "/change-password" },
    );
    await user.type(await screen.findByLabelText(/current \(temporary\) password/i), temporaryPassword);
    await user.type(screen.getByLabelText(/^new password/i), "MyNewPass123");
    await user.type(screen.getByLabelText(/confirm new password/i), "MyNewPass123");
    await user.click(screen.getByRole("button", { name: "Set a new password" }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith(dashboard));

    // 6. Log out; the temporary password no longer works, the new one does.
    await logout(user);
    change.unmount();
    mockRouter.replace.mockClear();
    const again = renderWithProviders(<LoginForm />, { route: "/login" });
    await signIn(user, email, temporaryPassword);
    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.");
    again.unmount();
    renderWithProviders(<LoginForm />, { route: "/login" });
    await signIn(user, email, "MyNewPass123");
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith(dashboard));
  }, 30_000);
});
