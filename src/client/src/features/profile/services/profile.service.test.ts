import { describe, expect, it, vi } from "vitest";
import { api } from "@/libs/api-client";
import { RealProfileService } from "@/features/profile/services/profile.service";

vi.mock("@/libs/api-client", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const getMock = vi.mocked(api.get);
const patchMock = vi.mocked(api.patch);

describe("RealProfileService", () => {
  it("requests and maps the server profile response", async () => {
    const signal = new AbortController().signal;
    getMock.mockResolvedValueOnce({
      success: true,
      payload: {
        message: "OK",
        data: {
          email: "student@example.edu",
          fullName: "Student Example",
          phoneNumber: "0901234567",
          avatarUrl: "https://example.edu/avatar.png",
          academicInfo: {
            studentNumber: "22120001",
            faculty: { name: "Faculty of Science" },
          },
        },
      },
    });

    await expect(new RealProfileService().getProfile(signal)).resolves.toEqual({
      email: "student@example.edu",
      fullName: "Student Example",
      phoneNumber: "0901234567",
      avatarUrl: "https://example.edu/avatar.png",
      academicInfo: {
        studentNumber: "22120001",
        faculty: { name: "Faculty of Science" },
      },
    });
    expect(getMock).toHaveBeenCalledWith("/api/v1/profile", { signal });
  });

  it("supports the documented success/data response", async () => {
    getMock.mockResolvedValueOnce({
      success: true,
      data: {
        email: "student@example.edu",
        fullName: "Student Example",
        phoneNumber: null,
        academicInfo: null,
      },
    });

    await expect(new RealProfileService().getProfile()).resolves.toMatchObject({
      phoneNumber: null,
      avatarUrl: null,
      academicInfo: null,
    });
  });

  it("rejects an invalid profile response", async () => {
    getMock.mockResolvedValueOnce({ success: true, payload: { data: {} } });

    await expect(new RealProfileService().getProfile()).rejects.toThrow(
      "The profile response is invalid",
    );
  });

  it("updates only the phone number and maps the returned profile", async () => {
    patchMock.mockResolvedValueOnce({
      success: true,
      payload: {
        message: "OK",
        data: {
          email: "student@example.edu",
          fullName: "Student Example",
          phoneNumber: "+84901234567",
          avatarUrl: null,
          academicInfo: null,
        },
      },
    });

    await expect(
      new RealProfileService().updatePhoneNumber("+84901234567"),
    ).resolves.toMatchObject({ phoneNumber: "+84901234567" });
    expect(patchMock).toHaveBeenCalledWith("/api/v1/profile", {
      phoneNumber: "+84901234567",
    });
  });

  it("sends null when clearing the phone number", async () => {
    patchMock.mockResolvedValueOnce({
      success: true,
      payload: {
        data: {
          email: "student@example.edu",
          fullName: "Student Example",
          phoneNumber: null,
          academicInfo: null,
        },
      },
    });

    await expect(
      new RealProfileService().updatePhoneNumber(null),
    ).resolves.toMatchObject({ phoneNumber: null });
    expect(patchMock).toHaveBeenCalledWith("/api/v1/profile", {
      phoneNumber: null,
    });
  });
});
