import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { readDb, setMockFailures, updateDb } from "@/mocks/db/store";
import { renderWithProviders, signInAs } from "../../../../tests/test-utils";

// Against the MSW profile handlers (they answer like src/server); the mock DB is reset before each test.
// Titles are dev's; scenario map: specs/006-integrate-profile/coverage.md (PP).
const STUDENT = "student1@example.invalid";
const AVATAR = "/api/v1/profile/avatar/files/saved.png";

function setup(change?: (user: ReturnType<typeof readDb>["users"][number]) => void) {
  updateDb((db) => {
    const user = db.users.find((u) => u.email === STUDENT)!;
    user.phoneNumber = "0901234567";
    user.avatarUrl = AVATAR;
    change?.(user);
  });
  signInAs(STUDENT);
  return renderWithProviders(<ProfilePage />, { route: "/profile" });
}

const stored = () => readDb().users.find((u) => u.email === STUDENT)!;

describe("ProfilePage", () => {
  it("shows loading state before rendering saved profile and read-only identity", async () => {
    const { container } = setup();

    expect(screen.getByText("Loading your profile")).toBeInTheDocument();

    expect(await screen.findByText("Nguyễn Văn An")).toBeInTheDocument();
    expect(screen.getByText("0901234567")).toBeInTheDocument();
    expect(screen.getByText("23127001")).toBeInTheDocument();
    expect(screen.getByText("Computer and Information Technology field")).toBeInTheDocument();
    expect(screen.getByText("Read only")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Change password" })).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toBeInTheDocument();
    expect(container.querySelector('[name="fullName"]')).not.toBeInTheDocument();
    expect(container.querySelector('[name="studentNumber"]')).not.toBeInTheDocument();
    expect(container.querySelector('[name="faculty"]')).not.toBeInTheDocument();
    expect(screen.getByText("23127001").tagName).toBe("DD");
    expect(screen.getByText("Computer and Information Technology field").tagName).toBe("DD");
    expect(screen.getByRole("img", { name: "Nguyễn Văn An's profile picture" })).toHaveAttribute("src", AVATAR);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows unavailable academic details and an avatar fallback", async () => {
    updateDb((db) => {
      const manager = db.users.find((u) => u.email === "manager1@example.invalid")!;
      manager.phoneNumber = null;
      manager.avatarUrl = null;
    });
    signInAs("manager1@example.invalid");
    renderWithProviders(<ProfilePage />, { route: "/profile" });

    expect(await screen.findByText("No academic information available")).toBeInTheDocument();
    expect(screen.getByText("Not provided")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "No profile picture" })).toHaveTextContent("T");
  });

  it("shows an error and retries the profile request", async () => {
    setMockFailures(["getProfile"]);
    setup();

    expect(await screen.findByText("Profile could not be loaded")).toBeInTheDocument();
    expect(screen.queryByText("Nguyễn Văn An")).not.toBeInTheDocument();
    expect(screen.queryByText("0901234567")).not.toBeInTheDocument();
    expect(screen.queryByText("Phone number updated successfully.")).not.toBeInTheDocument();
    setMockFailures([]);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.getByText("Nguyễn Văn An")).toBeInTheDocument());
  });

  it("validates the phone number without discarding the entered value", async () => {
    setup();

    fireEvent.click(await screen.findByRole("button", { name: "Edit phone number" }));
    const phoneInput = screen.getByRole("textbox", { name: "Phone number" });
    fireEvent.change(phoneInput, { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter 0 followed by 9 digits, or +84 followed by 9 digits.", // shared rule (plan 006 Q4)
    );
    expect(phoneInput).toHaveValue("12345");
    expect(phoneInput).toHaveAttribute("aria-invalid", "true");
    expect(stored().phoneNumber).toBe("0901234567"); // nothing sent, nothing changed
    expect(screen.queryByRole("textbox", { name: "Student number" })).not.toBeInTheDocument();
  });

  it("saves a valid phone number and refreshes the displayed profile", async () => {
    setup();

    fireEvent.click(await screen.findByRole("button", { name: "Edit phone number" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Phone number" }), { target: { value: "+84901234567" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("+84901234567")).toBeInTheDocument();
    expect(screen.getByText("Phone number updated successfully.")).toBeInTheDocument();
    expect(stored().phoneNumber).toBe("+84901234567");
    expect(screen.getByText("23127001")).toBeInTheDocument();
    expect(screen.getByText("Computer and Information Technology field")).toBeInTheDocument();
  });

  it("discards unsaved edits when canceled", async () => {
    setup();

    fireEvent.click(await screen.findByRole("button", { name: "Edit phone number" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Phone number" }), { target: { value: "0911111111" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("0901234567")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Phone number" })).not.toBeInTheDocument();
    expect(stored().phoneNumber).toBe("0901234567");
  });

  it("shows save errors and keeps the entered phone number for correction", async () => {
    // Another account already uses the number (the BE answers 409 for either format).
    updateDb((db) => {
      db.users.find((u) => u.email === "manager1@example.invalid")!.phoneNumber = "+84911111111";
    });
    setup();

    fireEvent.click(await screen.findByRole("button", { name: "Edit phone number" }));
    const phoneInput = screen.getByRole("textbox", { name: "Phone number" });
    fireEvent.change(phoneInput, { target: { value: "0911111111" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Phone number is already in use");
    expect(phoneInput).toHaveValue("0911111111");
    expect(screen.queryByText("Phone number updated successfully.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("0901234567")).toBeInTheDocument();
    expect(screen.queryByText("Phone number updated successfully.")).not.toBeInTheDocument();
    expect(stored().phoneNumber).toBe("0901234567");
  });
});

it("offers retry when the saved picture fails to load", async () => {
  setup();
  const image = await screen.findByAltText("Nguyễn Văn An's profile picture");
  fireEvent.error(image);
  expect(screen.getByRole("img", { name: "No profile picture" })).toBeInTheDocument();
  fireEvent.click(screen.getByText("Retry picture"));
  expect(screen.getByAltText("Nguyễn Văn An's profile picture")).toBeInTheDocument();
});

it("restores the default picture after confirmed removal", async () => {
  setup();
  fireEvent.click(await screen.findByText("Remove picture"));
  fireEvent.click(screen.getByText("Confirm removal"));
  await waitFor(() => expect(screen.getByRole("img", { name: "No profile picture" })).toBeInTheDocument());
  expect(stored().avatarUrl).toBeNull();
});

it("shows a server validation error on the phone field while preserving the draft", async () => {
  updateDb((db) => {
    db.users.find((u) => u.email === "manager1@example.invalid")!.phoneNumber = "0911111111";
  });
  setup();
  fireEvent.click(await screen.findByRole("button", { name: "Edit phone number" }));
  const input = screen.getByRole("textbox", { name: "Phone number" });
  fireEvent.change(input, { target: { value: "0911111111" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(input).toHaveAttribute("aria-invalid", "true"));
  expect(input).toHaveValue("0911111111");
  expect(screen.queryByText("Phone number updated successfully.")).not.toBeInTheDocument();
});
