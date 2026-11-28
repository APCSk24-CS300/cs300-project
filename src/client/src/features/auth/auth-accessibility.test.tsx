import { describe, it } from "vitest";
import { ForbiddenView } from "@/components/layout/ForbiddenView";
import LoginForm from "@/features/auth/components/LoginForm";
import { LogoutNotice } from "@/features/auth/components/LogoutNotice";
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import { useAuth } from "@/hooks/useAuth";
import { expectNoA11yViolations, render, renderWithProviders, screen, signInAs } from "../../../tests/test-utils";

function Ready({ children }: { children: React.ReactNode }) {
  return useAuth().user ? <>{children}</> : null;
}

/** SC-010: no serious or critical axe violations on the auth screens. */
describe("auth screens accessibility", () => {
  it("sign-in (with a notice)", async () => {
    const { container } = renderWithProviders(
      <main>
        <h1>Sign In</h1>
        <LogoutNotice reason="expired" />
        <LoginForm />
      </main>,
      { route: "/login" },
    );
    await screen.findByLabelText(/email address/i);
    await expectNoA11yViolations(container);
  });

  it("Set a new password", async () => {
    signInAs("newuser@example.invalid");
    const { container } = renderWithProviders(
      <main>
        <Ready>
          <h1>Set a new password</h1>
          <ChangePasswordForm />
        </Ready>
      </main>,
      { route: "/change-password" },
    );
    await screen.findByLabelText(/current \(temporary\) password/i);
    await expectNoA11yViolations(container);
  });

  it("no-permission view", async () => {
    const { container } = render(
      <main>
        <h1>No permission</h1>
        <ForbiddenView dashboardHref="/student/dashboard" />
      </main>,
    );
    await expectNoA11yViolations(container);
  });
});
