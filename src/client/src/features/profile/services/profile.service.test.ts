import { describe, expect, it } from "vitest";
import { profileService } from "@/features/profile/services/profile.service";
import { readDb, setMockFailures, updateDb } from "@/mocks/db/store";
import { signInAs } from "../../../../tests/test-utils";

// Against the MSW profile handlers through the single API client; titles are dev's (coverage.md, PS).
// The two envelope cases ("supports the documented success/data response", "rejects an invalid
// profile response") are mapper tests: mappers/profile.mapper.test.ts.
const STUDENT = "student1@example.invalid";
const stored = () => readDb().users.find((u) => u.email === STUDENT)!;
const png = () => new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 9])], "me.png", { type: "image/png" });

describe("profile service", () => {
  it("requests and maps the server profile response", async () => {
    signInAs(STUDENT);
    await expect(profileService.getProfile()).resolves.toEqual({
      email: STUDENT,
      fullName: "Nguyễn Văn An",
      phoneNumber: null,
      avatarUrl: null,
      academicInfo: { studentNumber: "23127001", faculty: { name: "Computer and Information Technology field" } },
    });
  });

  it("updates only the phone number and maps the returned profile", async () => {
    signInAs(STUDENT);
    const profile = await profileService.updatePhoneNumber("+84901234567");
    expect(profile).toMatchObject({ phoneNumber: "+84901234567", fullName: "Nguyễn Văn An" });
    expect(stored()).toMatchObject({ phoneNumber: "+84901234567", fullName: "Nguyễn Văn An", email: STUDENT });
  });

  it("sends null when clearing the phone number", async () => {
    updateDb((db) => {
      db.users.find((u) => u.email === STUDENT)!.phoneNumber = "0901234567";
    });
    signInAs(STUDENT);
    await expect(profileService.updatePhoneNumber(null)).resolves.toMatchObject({ phoneNumber: null });
    expect(stored().phoneNumber).toBeNull();
  });

  it("uploads multipart avatar content and validates the active URL", async () => {
    signInAs(STUDENT);
    const url = await profileService.uploadAvatar(png());
    expect(url).toMatch(/^\/api\/v1\/profile\/avatar\/files\/[0-9a-f-]{36}\.png$/);
    expect(stored().avatarUrl).toBe(url);
    await expect(profileService.uploadAvatar(new File(["text"], "x.png", { type: "image/png" }))).rejects.toMatchObject({
      status: 400,
      code: "UNSUPPORTED_FILE",
    });
    expect(stored().avatarUrl).toBe(url);
  });

  it("removes the avatar only when the API confirms success", async () => {
    signInAs(STUDENT);
    const url = await profileService.uploadAvatar(png());
    setMockFailures(["removeAvatar"]);
    await expect(profileService.removeAvatar()).rejects.toMatchObject({ status: 500 });
    expect(stored().avatarUrl).toBe(url);
    setMockFailures([]);
    await expect(profileService.removeAvatar()).resolves.toBeUndefined();
    expect(stored().avatarUrl).toBeNull();
  });
});
