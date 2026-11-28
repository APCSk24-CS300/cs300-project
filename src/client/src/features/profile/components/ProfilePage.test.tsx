import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { useAuth } from "@/hooks/useAuth";
import { putAvatarFile } from "@/mocks/db/avatar-files";
import { readDb, setMockFailures, updateDb } from "@/mocks/db/store";
import { server } from "@/mocks/node";
import { PHONE_INVALID } from "@/libs/validation/phone";
import { expectNoA11yViolations, renderWithProviders, signInAs } from "../../../../tests/test-utils";

// Against the MSW profile handlers (they answer like src/server); the mock DB is reset before each test.
// Titles are dev's (step 4) plus step 5/6 additions; scenario map: specs/006-integrate-profile/coverage.md (PP).
const STUDENT = "student1@example.invalid";
const AVATAR = "/api/v1/profile/avatar/files/saved.png";
const PNG_BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1]);

function seed(change?: (user: ReturnType<typeof readDb>["users"][number]) => void, withFile = true) {
  updateDb((db) => {
    const user = db.users.find((u) => u.email === STUDENT)!;
    user.phoneNumber = "0901234567";
    user.avatarUrl = AVATAR;
    change?.(user);
  });
  if (withFile) putAvatarFile("saved.png", { bytes: PNG_BYTES, mime: "image/png" });
}

function setup(change?: Parameters<typeof seed>[0], withFile = true) {
  seed(change, withFile);
  signInAs(STUDENT);
  return renderWithProviders(<ProfilePage />, { route: "/profile" });
}

const stored = () => readDb().users.find((u) => u.email === STUDENT)!;
const phoneBox = () => screen.getByRole("textbox", { name: /^phone number/i });

async function editPhone(value: string) {
  fireEvent.click(await screen.findByRole("button", { name: "Edit phone number" }));
  fireEvent.change(phoneBox(), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
}

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
    expect(screen.getByLabelText(/^current password/i)).toBeInTheDocument();
    expect(container.querySelector('[name="fullName"]')).not.toBeInTheDocument();
    expect(container.querySelector('[name="studentNumber"]')).not.toBeInTheDocument();
    expect(container.querySelector('[name="faculty"]')).not.toBeInTheDocument();
    expect(screen.getByText("23127001").tagName).toBe("DD");
    expect(screen.getByText("Computer and Information Technology field").tagName).toBe("DD");
    // The picture is fetched through the API client (bearer) and shown from an object URL (Q5).
    const image = await screen.findByRole("img", { name: "Nguyễn Văn An's profile picture" });
    expect(image.getAttribute("src")).toMatch(/^blob:/);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it("shows name, email, student number and faculty as text, not inputs", async () => {
    setup();
    const details = (await screen.findByRole("heading", { name: "Account details" })).closest("section")!;
    for (const value of ["Nguyễn Văn An", STUDENT, "Student", "23127001", "Computer and Information Technology field"]) {
      expect(within(details).getByText(value).tagName).toBe("DD");
    }
    expect(within(details).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(details).queryByRole("button")).not.toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: "Remove picture" })).not.toBeInTheDocument();
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
    await editPhone("12345");

    expect(await screen.findByText(PHONE_INVALID)).toBeInTheDocument(); // shared rule (plan 006 Q4)
    expect(phoneBox()).toHaveValue("12345");
    expect(phoneBox()).toHaveAttribute("aria-invalid", "true");
    expect(stored().phoneNumber).toBe("0901234567"); // nothing sent, nothing changed
    expect(screen.queryByRole("textbox", { name: /student number/i })).not.toBeInTheDocument();
  });

  it("saves a valid phone number and refreshes the displayed profile", async () => {
    setup();
    await editPhone("+84901234567");

    expect(await screen.findByText("+84901234567")).toBeInTheDocument();
    expect(screen.getByText("Phone number updated successfully.")).toBeInTheDocument();
    expect(stored().phoneNumber).toBe("+84901234567");
    expect(screen.getByText("23127001")).toBeInTheDocument();
    expect(screen.getByText("Computer and Information Technology field")).toBeInTheDocument();
  });

  it("discards unsaved edits when canceled", async () => {
    setup();

    fireEvent.click(await screen.findByRole("button", { name: "Edit phone number" }));
    fireEvent.change(phoneBox(), { target: { value: "0911111111" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("0901234567")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /^phone number/i })).not.toBeInTheDocument();
    expect(stored().phoneNumber).toBe("0901234567");
  });

  it("shows save errors and keeps the entered phone number for correction", async () => {
    setMockFailures(["updateProfile"]); // 500: a failure that is not about the field (A9)
    setup();
    await editPhone("0911111111");

    expect(await screen.findByRole("alert")).toHaveTextContent("Your phone number could not be saved. Please try again.");
    expect(phoneBox()).toHaveValue("0911111111");
    expect(screen.queryByText("Phone number updated successfully.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("0901234567")).toBeInTheDocument();
    expect(screen.queryByText("Phone number updated successfully.")).not.toBeInTheDocument();
    expect(stored().phoneNumber).toBe("0901234567");
  });
});

it("offers retry when the saved picture fails to load", async () => {
  setup(undefined, false); // the URL is saved but the file read answers 404 (UC-03 A9)
  expect(await screen.findByText("Retry picture")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "No profile picture" })).toBeInTheDocument();
  putAvatarFile("saved.png", { bytes: PNG_BYTES, mime: "image/png" });
  fireEvent.click(screen.getByText("Retry picture"));
  expect(await screen.findByRole("img", { name: "Nguyễn Văn An's profile picture" })).toBeInTheDocument();
});

it("restores the default picture after confirmed removal", async () => {
  setup();
  await screen.findByRole("img", { name: "Nguyễn Văn An's profile picture" });
  fireEvent.click(screen.getByRole("button", { name: "Remove picture" }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Remove your profile picture?" })).getByText("Confirm removal"));
  await waitFor(() => expect(screen.getByRole("img", { name: "No profile picture" })).toBeInTheDocument());
  expect(stored().avatarUrl).toBeNull();
});

it("shows a server validation error on the phone field while preserving the draft", async () => {
  updateDb((db) => {
    db.users.find((u) => u.email === "manager1@example.invalid")!.phoneNumber = "0911111111";
  });
  setup();
  await editPhone("+84911111111"); // the same number in the other format: 409 on the field
  await waitFor(() => expect(phoneBox()).toHaveAttribute("aria-invalid", "true"));
  expect(screen.getByText("This phone number is already used by another account.")).toBeInTheDocument();
  expect(phoneBox()).toHaveValue("+84911111111");
  expect(screen.queryByText("Phone number updated successfully.")).not.toBeInTheDocument();
});

// ---- step 5: one session store, forbidden ----

function SessionProbe() {
  const { user } = useAuth();
  return <p data-testid="session-avatar">{user ? String(user.avatarUrl) : "no user"}</p>;
}

it("refreshes the signed-in user (AccountMenu) after a saved change", async () => {
  seed();
  signInAs(STUDENT);
  // One AuthProvider for the page and the probe, as in the app (AccountMenu reads the same provider).
  renderWithProviders(
    <>
      <ProfilePage />
      <SessionProbe />
    </>,
    { route: "/profile" },
  );
  await waitFor(() => expect(screen.getByTestId("session-avatar")).toHaveTextContent(AVATAR));
  fireEvent.click(await screen.findByRole("button", { name: "Remove picture" }));
  fireEvent.click(screen.getByText("Confirm removal"));
  // The provider re-read /auth/me: AccountMenu's user follows the server, no second store (plan 006 O4).
  await waitFor(() => expect(screen.getByTestId("session-avatar")).toHaveTextContent("null"));
});

it("shows the forbidden view when the API refuses the profile with 403", async () => {
  server.use(
    http.get("http://localhost:8080/api/v1/profile", () =>
      HttpResponse.json({ success: false, code: "FORBIDDEN", message: "Forbidden" }, { status: 403 }),
    ),
  );
  setup();
  expect(await screen.findByText("You don't have permission to view this page")).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Go to my dashboard" })).toHaveAttribute("href", "/student/dashboard"),
  );
});
