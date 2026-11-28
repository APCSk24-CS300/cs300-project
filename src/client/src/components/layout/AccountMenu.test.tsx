import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { expectNoA11yViolations, render, screen } from "../../../tests/test-utils";

const user = { fullName: "Lê Quốc Huy", email: "admin@example.invalid", role: "administrator" as const };

describe("AccountMenu (UC-02 step 1, A1)", () => {
  it("shows name, role, My profile and Log out; focus starts on the first item", async () => {
    const { container } = render(<AccountMenu user={user} onLogout={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /account menu/i }));
    expect(screen.getByRole("menu")).toHaveTextContent("Administrator");
    const profile = screen.getByRole("menuitem", { name: "My profile" });
    expect(profile).toHaveAttribute("href", "/profile");
    expect(profile).toHaveFocus();
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["My profile", "Log out"]);
    await expectNoA11yViolations(container);
  });

  it("closes on Escape and outside click without logging out (A1)", async () => {
    const onLogout = vi.fn();
    render(
      <>
        <p>outside</p>
        <AccountMenu user={user} onLogout={onLogout} />
      </>,
    );
    const trigger = screen.getByRole("button", { name: /account menu/i });
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByText("outside"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(onLogout).not.toHaveBeenCalled();
  });

  it("logs out with Enter and disables the item while pending", async () => {
    const onLogout = vi.fn();
    const { rerender } = render(<AccountMenu user={user} onLogout={onLogout} />);
    await userEvent.click(screen.getByRole("button", { name: /account menu/i }));
    await userEvent.tab(); // from "My profile" to "Log out"
    expect(screen.getByRole("menuitem", { name: /log out/i })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onLogout).toHaveBeenCalledTimes(1);

    rerender(<AccountMenu user={user} onLogout={onLogout} pending />);
    await userEvent.click(screen.getByRole("button", { name: /account menu/i }));
    expect(screen.getByRole("menuitem", { name: /logging out/i })).toBeDisabled();
  });
  it("closes the menu when My profile is chosen (UC-03 step 1)", async () => {
    render(<AccountMenu user={user} onLogout={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /account menu/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: "My profile" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
