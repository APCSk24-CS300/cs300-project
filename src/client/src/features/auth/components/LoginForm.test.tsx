import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import LoginForm from "@/features/auth/components/LoginForm";
import { server } from "@/mocks/node";
import { TOKEN_STORAGE_KEY } from "@/libs/token-store";
import { SESSION_HINT_COOKIE } from "@/libs/session-hint";
import { mockRouter, renderWithProviders, screen, waitFor } from "../../../../tests/test-utils";

async function signIn(email: string, password = "demo2026") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/email address/i), email);
  await user.type(screen.getByLabelText(/^password/i), password);
  await user.click(screen.getByRole("button", { name: /log in/i }));
  return user;
}

describe("LoginForm (UC-01 basic flow)", () => {
  it("has no role selector, forgot-password link or social buttons (FR-001, FR-012)", async () => {
    renderWithProviders(<LoginForm />, { route: "/login" });
    expect(await screen.findByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.queryByText(/select user type/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /student|manager/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/forgot password/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/google|microsoft/i)).not.toBeInTheDocument();
  });

  it.each([
    ["student1@example.invalid", "/student/dashboard"],
    ["manager1@example.invalid", "/manager/dashboard"],
    ["admin@example.invalid", "/admin/dashboard"],
  ])("signs %s in and opens %s", async (email, dashboard) => {
    renderWithProviders(<LoginForm />, { route: "/login" });
    await signIn(email);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith(dashboard));
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeTruthy();
    const cookieNames = document.cookie.split(";").map((c) => c.trim().split("=")[0]).filter(Boolean);
    expect(cookieNames).toEqual([SESSION_HINT_COOKIE]);
    expect(document.cookie).not.toContain(window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? "§");
  });

  it("honors a safe same-role return path and ignores others", async () => {
    renderWithProviders(<LoginForm redirectTo="/admin/users?page=2" />, { route: "/login" });
    await signIn("admin@example.invalid");
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/admin/users?page=2"));
  });

  it.each(["https://evil.example", "/admin/users", "//evil.example"])(
    "ignores the unsafe or other-role return path %s",
    async (redirectTo) => {
      renderWithProviders(<LoginForm redirectTo={redirectTo} />, { route: "/login" });
      await signIn("student1@example.invalid");
      await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/student/dashboard"));
    },
  );

  it("shows the pending state and sends only one request on double click", async () => {
    let calls = 0;
    server.use(
      http.post("http://localhost:8080/api/v1/auth/login", async () => {
        calls += 1;
        await delay(300);
        return HttpResponse.json({ success: false, code: "INVALID_CREDENTIALS", message: "x" }, { status: 401 });
      }),
    );
    renderWithProviders(<LoginForm />, { route: "/login" });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), "student1@example.invalid");
    await user.type(screen.getByLabelText(/^password/i), "demo2026");
    const button = screen.getByRole("button", { name: /log in/i });
    await user.dblClick(button);
    expect(await screen.findByRole("button", { name: /logging in/i })).toBeDisabled();
    await screen.findByRole("alert");
    expect(calls).toBe(1);
  });

  it("keeps working when the login endpoint is overridden (sanity)", async () => {
    server.use(
      http.post("http://localhost:8080/api/v1/auth/login", () =>
        HttpResponse.json({ success: false, code: "INVALID_CREDENTIALS", message: "x" }, { status: 401 }),
      ),
    );
    renderWithProviders(<LoginForm />, { route: "/login" });
    await signIn("student1@example.invalid");
    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.");
  });
});
