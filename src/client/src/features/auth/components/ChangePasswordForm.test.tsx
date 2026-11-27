import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import { server } from "@/mocks/node";
import { readDb, setMockFailures } from "@/mocks/db/store";
import { readHint } from "@/libs/session-hint";
import { useAuth } from "@/hooks/useAuth";
import {
  expectNoA11yViolations,
  mockRouter,
  renderWithProviders,
  screen,
  signInAs,
  waitFor,
} from "../../../../tests/test-utils";

function Ready({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : null;
}

async function setup(redirectTo?: string) {
  signInAs("newuser@example.invalid");
  const user = userEvent.setup();
  const view = renderWithProviders(
    <Ready>
      <h1>Set a new password</h1>
      <ChangePasswordForm redirectTo={redirectTo} />
    </Ready>,
    { route: "/change-password" },
  );
  await screen.findByLabelText(/current \(temporary\) password/i);
  return { user, ...view };
}

async function fill(user: ReturnType<typeof userEvent.setup>, current: string, next: string, confirm = next) {
  await user.type(screen.getByLabelText(/current \(temporary\) password/i), current);
  await user.type(screen.getByLabelText(/^new password/i), next);
  await user.type(screen.getByLabelText(/confirm new password/i), confirm);
  await user.click(screen.getByRole("button", { name: "Set a new password" }));
}

describe("ChangePasswordForm (US7)", () => {
  it("is titled 'Set a new password' and passes axe", async () => {
    const { container } = await setup();
    expect(screen.getByRole("heading", { name: "Set a new password" })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it("changes the password, refreshes the context and opens the dashboard", async () => {
    const { user } = await setup();
    await fill(user, "demo2026", "NewPass123");
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/student/dashboard"));
    expect(readHint()?.mustChangePassword).toBe(false);
    expect(readDb().users.find((u) => u.email === "newuser@example.invalid")?.mustChangePassword).toBe(false);
  });

  it("continues to a safe return page", async () => {
    const { user } = await setup("/student/dashboard?tab=x");
    await fill(user, "demo2026", "NewPass123");
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/student/dashboard?tab=x"));
  });

  it("checks length, difference and confirmation before sending", async () => {
    let calls = 0;
    server.events.on("request:start", ({ request }) => {
      if (request.url.endsWith("/profile/password")) calls += 1;
    });
    const { user } = await setup();
    await fill(user, "demo2026", "short", "short");
    expect(await screen.findByText("Use at least 8 characters")).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/^new password/i));
    await user.type(screen.getByLabelText(/^new password/i), "demo2026");
    await user.click(screen.getByRole("button", { name: "Set a new password" }));
    expect(await screen.findByText("Choose a password different from the temporary one")).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/^new password/i));
    await user.type(screen.getByLabelText(/^new password/i), "NewPass123");
    await user.click(screen.getByRole("button", { name: "Set a new password" }));
    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(calls).toBe(0);
    server.events.removeAllListeners();
  });

  it("A7: a wrong current password is reported and nothing changes", async () => {
    const { user } = await setup();
    await fill(user, "wrong-one", "NewPass123");
    expect(await screen.findByText("Current password is incorrect")).toBeInTheDocument();
    expect(readDb().users.find((u) => u.email === "newuser@example.invalid")?.passwordPlain).toBe("demo2026");
  });

  it("shows a retryable error on a network failure", async () => {
    const { user } = await setup();
    setMockFailures(["changePassword:network"]);
    await fill(user, "demo2026", "NewPass123");
    expect(await screen.findByRole("alert")).toHaveTextContent("The service is unavailable. Please try again.");
    expect(readDb().users.find((u) => u.email === "newuser@example.invalid")?.passwordPlain).toBe("demo2026");
  });

  it("sends one request on double submit while pending (FR-048)", async () => {
    let calls = 0;
    server.use(
      http.patch("http://localhost:8080/api/v1/profile/password", async () => {
        calls += 1;
        await delay(300);
        return HttpResponse.json({ success: false, code: "UNKNOWN", message: "x" }, { status: 500 });
      }),
    );
    const { user } = await setup();
    await user.type(screen.getByLabelText(/current \(temporary\) password/i), "demo2026");
    await user.type(screen.getByLabelText(/^new password/i), "NewPass123");
    await user.type(screen.getByLabelText(/confirm new password/i), "NewPass123");
    await user.dblClick(screen.getByRole("button", { name: "Set a new password" }));
    await screen.findByRole("alert");
    expect(calls).toBe(1);
  });
});
