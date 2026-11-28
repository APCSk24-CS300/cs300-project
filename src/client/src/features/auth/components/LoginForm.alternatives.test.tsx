import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import LoginForm from "@/features/auth/components/LoginForm";
import { RequireSession } from "@/features/auth/components/RequireSession";
import { server } from "@/mocks/node";
import { mockDevTools } from "@/mocks/dev-tools";
import { setMockFailures } from "@/mocks/db/store";
import { TOKEN_STORAGE_KEY } from "@/libs/token-store";
import { readHint } from "@/libs/session-hint";
import { mockRouter, renderWithProviders, screen, signInAs, waitFor } from "../../../../tests/test-utils";

async function submit(email: string, password = "demo2026") {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText(/email address/i), email);
  if (password) await user.type(screen.getByLabelText(/^password/i), password);
  await user.click(screen.getByRole("button", { name: /log in/i }));
}

const renderLogin = () => renderWithProviders(<LoginForm />, { route: "/login" });

describe("UC-01 alternative flows", () => {
  it("A1: invalid input shows field guidance, sends nothing and keeps the email", async () => {
    let requests = 0;
    server.events.on("request:start", () => {
      requests += 1;
    });
    renderLogin();
    await submit("", "");
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/email address/i), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toHaveValue("not-an-email");
    expect(requests).toBe(0);
    server.events.removeAllListeners();
  });

  it("A2: unknown email and wrong password show the same message", async () => {
    const { unmount } = renderLogin();
    await submit("nobody@example.invalid");
    const first = (await screen.findByRole("alert")).textContent;
    unmount();

    renderLogin();
    await submit("student1@example.invalid", "wrong-pass");
    const second = (await screen.findByRole("alert")).textContent;
    expect(first).toBe("Email or password is incorrect.");
    expect(second).toBe(first);
    expect(screen.getByLabelText(/email address/i)).toHaveValue("student1@example.invalid");
    expect(screen.getByLabelText(/^password/i)).toHaveValue("");
  });

  it("A3: a disabled account is denied and no token is stored", async () => {
    renderLogin();
    await submit("disabled@example.invalid");
    expect(await screen.findByRole("alert")).toHaveTextContent("This account is disabled. Contact the administrator.");
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("A4: a locked account shows when retry is allowed", async () => {
    renderLogin();
    for (let i = 0; i < 5; i += 1) {
      await submit(i === 0 ? "manager1@example.invalid" : "", "bad-pass");
      await screen.findByRole("alert");
    }
    expect(screen.getByRole("alert")).toHaveTextContent(/Too many failed attempts\. Try again after \d{2}:\d{2}\./);
  });

  it("A5: the service is unavailable, the email is kept", async () => {
    renderLogin();
    await submit("outage@example.invalid");
    expect(await screen.findByRole("alert")).toHaveTextContent("The service is unavailable. Please try again.");
    expect(screen.getByLabelText(/email address/i)).toHaveValue("outage@example.invalid");

    setMockFailures(["login:network"]);
    await submit("", "demo2026");
    expect(await screen.findByRole("alert")).toHaveTextContent("The service is unavailable. Please try again.");
  });

  it("A6: an account without a role is not admitted", async () => {
    renderLogin();
    await submit("norole@example.invalid");
    expect(await screen.findByRole("alert")).toHaveTextContent("This account cannot be signed in. Contact the administrator.");
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(readHint()).toBeNull();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it.each(["me", "me:network"] as const)(
    "A6 / FR-007a: a context failure (%s) right after login discards the token",
    async (failure) => {
      setMockFailures([failure]);
      renderLogin();
      await submit("student1@example.invalid");
      expect(await screen.findByRole("alert")).toHaveTextContent("The service is unavailable. Please try again.");
      expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    },
  );

  it("A7: an already signed-in user on /login goes to the dashboard without a new login", async () => {
    signInAs("manager1@example.invalid");
    renderLogin();
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/manager/dashboard"));
  });

  it("reload, inactive (H6): the session is cleared and /login?reason=disabled opens", async () => {
    signInAs("student1@example.invalid");
    mockDevTools.disable("student1@example.invalid");
    renderWithProviders(<RequireSession>protected</RequireSession>, { route: "/student/dashboard" });
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/login?reason=disabled"));
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(readHint()).toBeNull();
    expect(screen.queryByText("protected")).not.toBeInTheDocument();
  });

  it("reload, role missing (H6): the session is cleared and /login?reason=role-missing opens", async () => {
    signInAs("student1@example.invalid");
    mockDevTools.setRole("student1@example.invalid", null);
    renderWithProviders(<RequireSession>protected</RequireSession>, { route: "/student/dashboard" });
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/login?reason=role-missing"));
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
  });
});
