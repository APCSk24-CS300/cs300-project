import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PasswordChangeForm } from "@/features/profile/components/PasswordChangeForm";
import { server } from "@/mocks/node";
import { readDb } from "@/mocks/db/store";
import { signInAs } from "../../../../tests/test-utils";

// Against the MSW PATCH /profile/password handler; titles are dev's. Step 6 moves these tests to
// ChangePasswordForm (variant "profile"); coverage.md row CPF.
const STUDENT = "student1@example.invalid"; // seed password "demo2026"
const sentBodies: unknown[] = [];
const onRequest = async ({ request }: { request: Request }) => {
  if (new URL(request.url).pathname.endsWith("/profile/password")) sentBodies.push(await request.clone().json());
};
server.events.on("request:start", onRequest);
afterEach(() => {
  sentBodies.length = 0;
});

function fillForm({
  currentPassword = "demo2026",
  newPassword = "new-secret-password",
  confirmPassword = newPassword,
}: {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
} = {}) {
  fireEvent.change(screen.getByLabelText("Current password"), { target: { value: currentPassword } });
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: newPassword } });
  fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: confirmPassword } });
}

const password = () => readDb().users.find((u) => u.email === STUDENT)!.passwordPlain;

describe("PasswordChangeForm", () => {
  it.each([
    ["a missing current password", "", "newpass8", "newpass8", "Enter your current password."],
    ["a seven-character new password", "demo2026", "1234567", "1234567", "Your new password must be at least 8 characters."],
    ["mismatched confirmation", "demo2026", "new-secret-password", "different-secret", "The new password and confirmation do not match."],
  ])("rejects %s and clears all password fields", async (_case, currentPassword, newPassword, confirmPassword, message) => {
    signInAs(STUDENT);
    render(<PasswordChangeForm />);
    fillForm({ currentPassword, newPassword, confirmPassword });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
    expect(sentBodies).toEqual([]); // never sent
    expect(password()).toBe("demo2026");
  });

  it("submits only API password fields and shows loading and success states", async () => {
    signInAs(STUDENT);
    render(<PasswordChangeForm />);
    fillForm({ newPassword: "secret12" });

    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(screen.getByRole("button", { name: "Changing password…" })).toBeDisabled();
    expect(await screen.findByRole("status")).toHaveTextContent("Password changed successfully.");
    expect(sentBodies).toEqual([{ currentPassword: "demo2026", newPassword: "secret12" }]); // no confirmPassword
    expect(password()).toBe("secret12");
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
  });

  it("shows a safe failure message and clears fields when the request is rejected", async () => {
    signInAs(STUDENT);
    render(<PasswordChangeForm />);
    fillForm({ currentPassword: "wrong-password" }); // the server answers 400 CURRENT_PASSWORD_INCORRECT

    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Password could not be changed. Check your current password and try again.",
    );
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
    expect(password()).toBe("demo2026");
  });
});
