import { render, type RenderOptions } from "@testing-library/react";
import axe from "axe-core";
import type { ReactElement } from "react";
import { expect } from "vitest";
import { AuthContext, type AuthContextValue } from "@/features/auth/context/AuthContext";
import { AuthProvider } from "@/features/auth/provider/AuthProvider";
import { issueToken } from "@/mocks/utils/token";
import { readDb } from "@/mocks/db/store";
import { setToken } from "@/libs/token-store";
import { writeHint } from "@/libs/session-hint";
import { setMockRoute } from "./navigation-mock";

/** Renders inside the real AuthProvider (talking to the MSW mock) at the given route. */
export function renderWithProviders(
  ui: ReactElement,
  options: Omit<RenderOptions, "wrapper"> & { route?: string } = {},
) {
  const { route, ...rest } = options;
  if (route) {
    setMockRoute(route);
  }
  return render(<AuthProvider>{ui}</AuthProvider>, rest);
}

/** Renders with a hand-made auth context (no network). */
export function renderWithAuth(ui: ReactElement, value: AuthContextValue) {
  return render(<AuthContext.Provider value={value}>{ui}</AuthContext.Provider>);
}

/** Stores a valid mock token (+ hint) for a seeded user, as if they had signed in before. */
export function signInAs(email: string) {
  const user = readDb().users.find((u) => u.email === email);
  if (!user) {
    throw new Error(`No mock user ${email}`);
  }
  const { token, expiresAt } = issueToken(user);
  setToken(token);
  if (user.role) {
    writeHint({
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      exp: Math.floor(new Date(expiresAt).getTime() / 1000),
    });
  }
  return token;
}

export async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
    },
  });

  const seriousViolations = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );

  expect(seriousViolations).toEqual([]);
}

export * from "@testing-library/react";
export { mockRouter, setMockRoute } from "./navigation-mock";
