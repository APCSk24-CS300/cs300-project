import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a link when href is supplied", () => {
    render(<Button href="/login">Log In</Button>);

    expect(screen.getByRole("link", { name: "Log In" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("renders a button and forwards clicks", () => {
    let clicked = false;
    render(<Button onClick={() => (clicked = true)}>Try again</Button>);

    screen.getByRole("button", { name: "Try again" }).click();

    expect(clicked).toBe(true);
  });

  it("does not expose a destination for a disabled link", () => {
    render(
      <Button href="/login" disabled>
        Log In
      </Button>,
    );

    expect(screen.queryByRole("link", { name: "Log In" })).toBeNull();
    expect(screen.getByText("Log In").closest("[aria-disabled='true']")).toBeTruthy();
  });

  it("keeps an accessible name while loading", () => {
    render(<Button isLoading>Submitting</Button>);

    const button = screen.getByRole("button", { name: "Submitting" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
  });
});
