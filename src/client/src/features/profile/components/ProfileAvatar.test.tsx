import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { avatarFileName, ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { putAvatarFile } from "@/mocks/db/avatar-files";
import { updateDb } from "@/mocks/db/store";
import { server } from "@/mocks/node";
import { signInAs } from "../../../../tests/test-utils";

// The authenticated image (plan 006 O8, Q5); coverage.md row PAV.
const STUDENT = "student1@example.invalid";
const URL_SAVED = "/api/v1/profile/avatar/files/me.png";
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 7]);

const seen: { path: string; auth: string | null }[] = [];
const capture = ({ request }: { request: Request }) => {
  seen.push({ path: new URL(request.url).pathname, auth: request.headers.get("Authorization") });
};

function signedInWithPicture(withFile = true) {
  updateDb((db) => {
    db.users.find((u) => u.email === STUDENT)!.avatarUrl = URL_SAVED;
  });
  if (withFile) putAvatarFile("me.png", { bytes: PNG, mime: "image/png" });
  return signInAs(STUDENT);
}

afterEach(() => {
  server.events.removeListener("request:start", capture);
  seen.length = 0;
});

describe("ProfileAvatar", () => {
  it("loads the picture through the API client with the bearer", async () => {
    server.events.on("request:start", capture);
    const token = signedInWithPicture();
    render(<ProfileAvatar avatarUrl={URL_SAVED} name="Nguyễn Văn An" size="lg" />);

    const image = await screen.findByRole("img", { name: "Nguyễn Văn An's profile picture" });
    expect(image.getAttribute("src")).toMatch(/^blob:/);
    expect(seen).toEqual([{ path: "/api/v1/profile/avatar/files/me.png", auth: `Bearer ${token}` }]);
  });

  it("shows initials while loading, without a 'could not be loaded' message", async () => {
    signedInWithPicture();
    render(<ProfileAvatar avatarUrl={URL_SAVED} name="Nguyễn Văn An" showRetry />);
    expect(screen.getByRole("img", { name: "No profile picture" })).toHaveTextContent("NA");
    expect(screen.queryByText("Picture could not be loaded.")).not.toBeInTheDocument();
    expect(await screen.findByRole("img", { name: "Nguyễn Văn An's profile picture" })).toBeInTheDocument();
  });

  it("shows initials and Retry picture when the file read fails", async () => {
    signedInWithPicture(false); // the BE answers 404: not the current file (UC-03 A9)
    render(<ProfileAvatar avatarUrl={URL_SAVED} name="Nguyễn Văn An" size="lg" showRetry />);
    expect(await screen.findByText("Retry picture")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "No profile picture" })).toHaveTextContent("NA");

    putAvatarFile("me.png", { bytes: PNG, mime: "image/png" });
    fireEvent.click(screen.getByText("Retry picture"));
    expect(await screen.findByRole("img", { name: "Nguyễn Văn An's profile picture" })).toBeInTheDocument();
  });

  it("falls back to initials when the image itself cannot be decoded", async () => {
    signedInWithPicture();
    render(<ProfileAvatar avatarUrl={URL_SAVED} name="Lê Quốc Huy" showRetry />);
    fireEvent.error(await screen.findByRole("img", { name: "Lê Quốc Huy's profile picture" }));
    expect(screen.getByRole("img", { name: "No profile picture" })).toHaveTextContent("LH");
    expect(screen.getByText("Retry picture")).toBeInTheDocument();
  });

  it("requests nothing without a picture, and accepts only the BE's file URL shape", async () => {
    server.events.on("request:start", capture);
    signInAs(STUDENT);
    render(<ProfileAvatar avatarUrl={null} name="Trần Thị Bích" />);
    expect(screen.getByRole("img", { name: "No profile picture" })).toHaveTextContent("TB");
    expect(seen).toEqual([]);

    expect(avatarFileName("/api/v1/profile/avatar/files/4f1c-a.png")).toBe("4f1c-a.png");
    expect(avatarFileName("https://evil.example/x.png")).toBeNull();
    expect(avatarFileName("/api/v1/profile/avatar/files/../../x")).toBeNull();
    expect(avatarFileName(null)).toBeNull();
  });
});
