import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { LoadingState } from "@/components/ui/LoadingState";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { expectNoA11yViolations, render, screen } from "../../../tests/test-utils";

describe("FormField + inputs", () => {
  it("wires label, required marker, hint and error to the control", async () => {
    const { container } = render(
      <FormField label="Email" required hint="Use your school email" error="Enter a valid email address">
        <TextInput />
      </FormField>,
    );
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAccessibleDescription("Use your school email Enter a valid email address");
    expect(screen.getByText("Required")).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it("marks optional fields", () => {
    render(
      <FormField label="Phone">
        <TextInput />
      </FormField>,
    );
    expect(screen.getByText("Optional")).toBeInTheDocument();
  });

  it("toggles password visibility with an accessible button", async () => {
    render(
      <FormField label="Password" required>
        <PasswordInput />
      </FormField>,
    );
    const input = screen.getByLabelText(/^password/i);
    expect(input).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: /show password/i }));
    expect(input).toHaveAttribute("type", "text");
  });

  it("renders select options with a placeholder", () => {
    render(
      <FormField label="Faculty" required>
        <Select placeholder="Choose…" options={[{ value: "120", label: "CIT" }]} />
      </FormField>,
    );
    expect(screen.getByRole("combobox", { name: /faculty/i })).toHaveDisplayValue("Choose…");
    expect(screen.getByRole("option", { name: "CIT" })).toBeInTheDocument();
  });
});

describe("RadioGroup", () => {
  function Harness() {
    const [value, setValue] = useState<string | undefined>("student");
    return (
      <RadioGroup
        legend="Role"
        name="role"
        required
        value={value}
        onChange={setValue}
        options={[
          { value: "student", label: "Student" },
          { value: "manager", label: "Manager" },
        ]}
      />
    );
  }

  it("allows exactly one choice", async () => {
    const { container } = render(<Harness />);
    await userEvent.click(screen.getByRole("radio", { name: /manager/i }));
    expect(screen.getByRole("radio", { name: /manager/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /student/i })).not.toBeChecked();
    expect(screen.getByRole("group", { name: /role/i })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});

describe("Alert and LoadingState", () => {
  it("announces errors as alerts and other variants as status", () => {
    render(
      <>
        <Alert variant="error">Bad</Alert>
        <Alert variant="info">Info</Alert>
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Bad");
    expect(screen.getByRole("status")).toHaveTextContent("Info");
  });

  it("exposes a busy loading region", () => {
    render(<LoadingState label="Loading accounts…" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading accounts…")).toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  it("confirms, cancels and closes on Escape", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(
      <ConfirmDialog open title="Discard changes?" confirmLabel="Discard" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    expect(screen.getByRole("dialog", { name: /discard changes/i, hidden: true })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Discard", hidden: true }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Cancel", hidden: true }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    screen.getByRole("dialog", { hidden: true }).dispatchEvent(new Event("cancel", { cancelable: true }));
    expect(onCancel).toHaveBeenCalledTimes(2);
    rerender(<ConfirmDialog open={false} title="Discard changes?" confirmLabel="Discard" onConfirm={onConfirm} onCancel={onCancel} />);
  });
});
