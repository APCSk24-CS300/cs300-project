import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import LoginForm from "@/components/forms/LoginForm";
import {
  createAuthContextValue,
  createSessionUser,
} from "../../../tests/fixtures";
import { renderWithAuth } from "../../../tests/test-utils";

const routerMocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerMocks.replace,
  }),
}));

async function submitLogin(role: "Student" | "Manager" = "Student") {
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: role }));
  await user.type(
    screen.getByRole("textbox", { name: "Email address" }),
    "student@hcmus.edu.vn",
  );
  await user.type(screen.getByLabelText("Password"), "secret123");
  await user.click(screen.getByRole("button", { name: "Log In" }));
}

beforeEach(() => {
  routerMocks.replace.mockReset();
});

describe("LoginForm redirect handling", () => {
  it("uses a safe landing redirect target", async () => {
    const login = vi.fn(async () => createSessionUser("student"));

    renderWithAuth(
      <LoginForm redirectTo="/#services" />,
      createAuthContextValue({ login }),
    );

    await submitLogin();

    await waitFor(() =>
      expect(routerMocks.replace).toHaveBeenCalledWith("/#services"),
    );
    expect(login).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "student",
        email: "student@hcmus.edu.vn",
        password: "secret123",
      }),
    );
  });

  it("falls back to the role dashboard for an unsafe redirect target", async () => {
    const login = vi.fn(async () => createSessionUser("student"));

    renderWithAuth(
      <LoginForm redirectTo="https://evil.example" />,
      createAuthContextValue({ login }),
    );

    await submitLogin();

    await waitFor(() =>
      expect(routerMocks.replace).toHaveBeenCalledWith(
        "/student/dashboard",
      ),
    );
  });

  it("resolves the dashboard for the authenticated role", async () => {
    const login = vi.fn(async () => createSessionUser("manager"));

    renderWithAuth(
      <LoginForm />,
      createAuthContextValue({ login }),
    );

    await submitLogin("Manager");

    await waitFor(() =>
      expect(routerMocks.replace).toHaveBeenCalledWith(
        "/manager/dashboard",
      ),
    );
  });

  it("shows an alert and does not redirect when login fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const login = vi.fn(async () => {
      throw new Error("Invalid credentials");
    });

    renderWithAuth(
      <LoginForm redirectTo="/#services" />,
      createAuthContextValue({ login }),
    );

    await submitLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid credentials",
    );
    expect(routerMocks.replace).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
