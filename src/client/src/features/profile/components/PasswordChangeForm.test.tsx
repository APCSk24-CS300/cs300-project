import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PasswordChangeForm } from "@/features/profile/components/PasswordChangeForm";
import { authService } from "@/features/auth/services/auth.service";

vi.mock("@/features/auth/services/auth.service", () => ({
  authService: {
    changePassword: vi.fn(),
  },
}));

const changePasswordMock = vi.mocked(authService.changePassword);

beforeEach(() => {
  changePasswordMock.mockReset();
});

function fillForm({
  currentPassword = "current-secret",
  newPassword = "new-secret-password",
  confirmPassword = newPassword,
}: {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
} = {}) {
  fireEvent.change(screen.getByLabelText("Current password"), {
    target: { value: currentPassword },
  });
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: newPassword },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: confirmPassword },
  });
}

describe("PasswordChangeForm", () => {
  it.each([
    ["short passwords", "short", "short", "Your new password must be at least 8 characters."],
    ["mismatched confirmation", "new-secret-password", "different-secret", "The new password and confirmation do not match."],
  ])("rejects %s and clears all password fields", (_case, newPassword, confirmPassword, message) => {
    render(<PasswordChangeForm />);
    fillForm({ newPassword, confirmPassword });

    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("submits only API password fields and shows loading and success states", async () => {
    let resolveChange!: (response: { success: boolean; message: string }) => void;
    changePasswordMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveChange = resolve;
      }),
    );
    render(<PasswordChangeForm />);
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    const loadingButton = screen.getByRole("button", { name: "Changing password…" });
    expect(loadingButton).toBeDisabled();
    expect(changePasswordMock).toHaveBeenCalledWith({
      currentPassword: "current-secret",
      newPassword: "new-secret-password",
    });

    await act(async () => {
      resolveChange({ success: true, message: "Password changed successfully." });
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Password changed successfully.",
    );
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
  });

  it("shows a safe failure message and clears fields when the request is rejected", async () => {
    changePasswordMock.mockRejectedValueOnce(new Error("server error"));
    render(<PasswordChangeForm />);
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Password could not be changed. Check your current password and try again.",
    );
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
  });
});
