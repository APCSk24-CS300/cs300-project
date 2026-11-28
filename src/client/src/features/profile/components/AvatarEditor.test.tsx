import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AvatarEditor } from "./AvatarEditor";
import { readDb, setMockFailures, updateDb } from "@/mocks/db/store";
import { signInAs } from "../../../../tests/test-utils";

// Against the MSW avatar handlers (content-checked like the BE); titles are dev's (coverage.md, AE).
const STUDENT = "student1@example.invalid";
const SAVED = "/api/v1/profile/avatar/files/old.png";
const png = (name = "test.png") =>
  new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3])], name, { type: "image/png" });
const stored = () => readDb().users.find((u) => u.email === STUDENT)!.avatarUrl;
const NEW_URL = /^\/api\/v1\/profile\/avatar\/files\/[0-9a-f-]{36}\.png$/;

beforeEach(() => {
  updateDb((db) => {
    db.users.find((u) => u.email === STUDENT)!.avatarUrl = SAVED;
  });
  signInAs(STUDENT);
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

it("previews and saves a picture only after upload succeeds", async () => {
  const saved = vi.fn();
  render(<AvatarEditor avatarUrl={SAVED} onSaved={saved} />);
  fireEvent.change(screen.getByLabelText("Choose profile picture"), { target: { files: [png()] } });
  expect(await screen.findByAltText("New profile picture preview")).toBeInTheDocument();
  expect(stored()).toBe(SAVED); // nothing saved before "Save picture"
  fireEvent.click(screen.getByText("Save picture"));
  await waitFor(() => expect(saved).toHaveBeenCalledWith(expect.stringMatching(NEW_URL)));
  expect(screen.getByRole("status")).toHaveTextContent("updated");
  expect(stored()).toMatch(NEW_URL);
});

it("rejects unsupported input and preserves the saved image on upload failure", async () => {
  const saved = vi.fn();
  render(<AvatarEditor avatarUrl={SAVED} onSaved={saved} />);
  const input = screen.getByLabelText("Choose profile picture");
  fireEvent.change(input, { target: { files: [new File(["gif"], "x.gif", { type: "image/gif" })] } });
  expect(screen.getByRole("alert")).toHaveTextContent("JPG or PNG");
  expect(screen.queryByText("Save picture")).not.toBeInTheDocument(); // never sent

  // A file named .png whose content is not an image: the server rejects it (400 UNSUPPORTED_FILE).
  fireEvent.change(input, { target: { files: [new File(["not an image"], "x.png", { type: "image/png" })] } });
  fireEvent.click(await screen.findByText("Save picture"));
  expect(await screen.findByRole("alert")).toHaveTextContent("unchanged");
  expect(saved).not.toHaveBeenCalled();
  expect(stored()).toBe(SAVED);
});

it("confirms removal and restores the default only after success", async () => {
  const saved = vi.fn();
  render(<AvatarEditor avatarUrl={SAVED} onSaved={saved} />);
  fireEvent.click(screen.getByText("Remove picture"));
  expect(stored()).toBe(SAVED); // asking is not removing
  fireEvent.click(screen.getByText("Confirm removal"));
  await waitFor(() => expect(saved).toHaveBeenCalledWith(null));
  expect(stored()).toBeNull();
});

it("preserves the saved picture on removal failure", async () => {
  setMockFailures(["removeAvatar"]);
  const saved = vi.fn();
  render(<AvatarEditor avatarUrl={SAVED} onSaved={saved} />);
  fireEvent.click(screen.getByText("Remove picture"));
  fireEvent.click(screen.getByText("Confirm removal"));
  expect(await screen.findByRole("alert")).toHaveTextContent("retry");
  expect(saved).not.toHaveBeenCalled();
  expect(stored()).toBe(SAVED);
});

it("keeps the selected file for retry after storage failure, then updates only on success", async () => {
  setMockFailures(["uploadAvatar"]);
  const saved = vi.fn();
  render(<AvatarEditor avatarUrl={SAVED} onSaved={saved} />);
  fireEvent.change(screen.getByLabelText("Choose profile picture"), { target: { files: [png("retry.png")] } });
  fireEvent.click(await screen.findByText("Save picture"));
  expect(await screen.findByRole("alert")).toHaveTextContent("unchanged");
  expect(saved).not.toHaveBeenCalled();
  expect(stored()).toBe(SAVED);

  setMockFailures([]);
  fireEvent.click(screen.getByText("Save picture"));
  await waitFor(() => expect(saved).toHaveBeenCalledWith(expect.stringMatching(NEW_URL)));
  expect(saved).toHaveBeenCalledTimes(1);
  expect(stored()).toMatch(NEW_URL);
});
