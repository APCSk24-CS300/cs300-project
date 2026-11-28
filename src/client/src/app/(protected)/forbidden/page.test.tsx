import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProtectedLayout from "@/app/(protected)/layout";
import ForbiddenPage from "@/app/(protected)/forbidden/page";
import { ForbiddenView } from "@/components/layout/ForbiddenView";
import { isForbiddenError, useForbidden } from "@/hooks/useForbidden";
import { ApiError } from "@/libs/api-client";
import { render, renderWithProviders, screen, signInAs } from "../../../../tests/test-utils";

describe("no-permission page (FR-020)", () => {
  it("renders inside the shell with a link to the user's own dashboard", async () => {
    signInAs("student1@example.invalid");
    renderWithProviders(
      <ProtectedLayout>
        <ForbiddenPage />
      </ProtectedLayout>,
      { route: "/forbidden" },
    );
    expect(await screen.findByText(/don't have permission/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to my dashboard/i })).toHaveAttribute("href", "/student/dashboard");
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });

  it("ForbiddenView links to the given dashboard", () => {
    render(<ForbiddenView dashboardHref="/admin/dashboard" />);
    expect(screen.getByRole("link", { name: /go to my dashboard/i })).toHaveAttribute("href", "/admin/dashboard");
  });
});

describe("useForbidden / isForbiddenError (T030)", () => {
  it("recognizes only FORBIDDEN ApiErrors", () => {
    expect(isForbiddenError(new ApiError({ status: 403, code: "FORBIDDEN" }))).toBe(true);
    expect(isForbiddenError(new ApiError({ status: 403, code: "ACCOUNT_DISABLED" }))).toBe(false);
    expect(isForbiddenError(new Error("x"))).toBe(false);
  });

  it("handleError sets isForbidden and reports whether it handled the error", () => {
    const { result } = renderHook(() => useForbidden());
    let handled = false;
    act(() => {
      handled = result.current.handleError(new ApiError({ status: 500, code: "UNKNOWN" }));
    });
    expect(handled).toBe(false);
    expect(result.current.isForbidden).toBe(false);
    act(() => {
      handled = result.current.handleError(new ApiError({ status: 403, code: "FORBIDDEN" }));
    });
    expect(handled).toBe(true);
    expect(result.current.isForbidden).toBe(true);
  });
});
