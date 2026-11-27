import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { profileService } from "@/features/profile/services/profile.service";
import type { Profile } from "@/features/profile/types";
import { renderWithProviders } from "../../../../tests/test-utils";

vi.mock("@/features/profile/services/profile.service", () => ({
  profileService: {
    getProfile: vi.fn(),
  },
}));

const getProfileMock = vi.mocked(profileService.getProfile);

const profile: Profile = {
  email: "student@example.edu",
  fullName: "Student Example",
  phoneNumber: "0901234567",
  avatarUrl: "https://example.edu/avatar.png",
  academicInfo: {
    studentNumber: "22120001",
    faculty: { name: "Faculty of Science" },
  },
};

beforeEach(() => {
  getProfileMock.mockReset();
});

describe("ProfilePage", () => {
  it("shows loading state before rendering saved profile and read-only identity", async () => {
    let resolveProfile!: (value: Profile) => void;
    getProfileMock.mockReturnValueOnce(
      new Promise<Profile>((resolve) => {
        resolveProfile = resolve;
      }),
    );

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText("Loading your profile")).toBeInTheDocument();
    resolveProfile(profile);

    expect(await screen.findByText("Student Example")).toBeInTheDocument();
    expect(screen.getByText("0901234567")).toBeInTheDocument();
    expect(screen.getByText("22120001")).toBeInTheDocument();
    expect(screen.getByText("Faculty of Science")).toBeInTheDocument();
    expect(screen.getByText("Read only")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Student Example's profile picture" }),
    ).toHaveAttribute("src", profile.avatarUrl);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows unavailable academic details and an avatar fallback", async () => {
    getProfileMock.mockResolvedValueOnce({
      ...profile,
      avatarUrl: null,
      phoneNumber: null,
      academicInfo: null,
    });

    renderWithProviders(<ProfilePage />);

    expect(
      await screen.findByText("No academic information available"),
    ).toBeInTheDocument();
    expect(screen.getByText("Not provided")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "No profile picture" })).toHaveTextContent(
      "S",
    );
  });

  it("shows an error and retries the profile request", async () => {
    getProfileMock
      .mockRejectedValueOnce(new Error("Unauthorized"))
      .mockResolvedValueOnce(profile);

    renderWithProviders(<ProfilePage />);

    expect(await screen.findByText("Profile could not be loaded")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(screen.getByText("Student Example")).toBeInTheDocument(),
    );
    expect(getProfileMock).toHaveBeenCalledTimes(2);
  });
});
