import { render, type RenderOptions } from "@testing-library/react";
import axe from "axe-core";
import type { ReactElement } from "react";
import { expect } from "vitest";
import { AuthContext, type AuthContextValue } from "@/features/auth/context/AuthContext";

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, options);
}

export function renderWithAuth(ui: ReactElement, value: AuthContextValue) {
  return renderWithProviders(
    <AuthContext.Provider value={value}>{ui}</AuthContext.Provider>,
  );
}

export async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
    },
  });

  const criticalViolations = results.violations.filter(
    (violation) => violation.impact === "critical",
  );

  expect(criticalViolations).toEqual([]);
}

export * from "@testing-library/react";
