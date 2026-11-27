import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { profileService } from "@/features/profile/services/profile.service";
import type { Profile } from "@/features/profile/types";
import { renderWithProviders } from "../../../../tests/test-utils";

vi.mock("@/features/profile/services/profile.service", () => ({
  profileService: {
    getProfile: vi.fn(),
    updatePhoneNumber: vi.fn(),
  },
}));

const getProfileMock = vi.mocked(profileService.getProfile);
const updatePhoneNumberMock = vi.mocked(profileService.updatePhoneNumber);

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
  updatePhoneNumberMock.mockReset();
});

describe("ProfilePage", () => {
  it("shows loading state before rendering saved profile and read-only identity", async () => {
    let resolveProfile!: (value: Profile) => void;
    getProfileMock.mockReturnValueOnce(
      new Promise<Profile>((resolve) => {
        resolveProfile = resolve;
      }),
    );

    const { container } = renderWithProviders(<ProfilePage />);

    expect(screen.getByText("Loading your profile")).toBeInTheDocument();
    resolveProfile(profile);

    expect(await screen.findByText("Student Example")).toBeInTheDocument();
    expect(screen.getByText("0901234567")).toBeInTheDocument();
    expect(screen.getByText("22120001")).toBeInTheDocument();
    expect(screen.getByText("Faculty of Science")).toBeInTheDocument();
    expect(screen.getByText("Read only")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Change password" })).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toBeInTheDocument();
    expect(container.querySelector('[name="fullName"]')).not.toBeInTheDocument();
    expect(container.querySelector('[name="studentNumber"]')).not.toBeInTheDocument();
    expect(container.querySelector('[name="faculty"]')).not.toBeInTheDocument();
    expect(screen.getByText("22120001").tagName).toBe("DD");
    expect(screen.getByText("Faculty of Science").tagName).toBe("DD");
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

  it("validates the phone number without discarding the entered value", async () => {
    getProfileMock.mockResolvedValueOnce(profile);
    renderWithProviders(<ProfilePage />);

    fireEvent.click(await screen.findByRole("button", { name: "Edit phone number" }));
    const phoneInput = screen.getByRole("textbox", { name: "Phone number" });
    fireEvent.change(phoneInput, { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a 10-digit number",
    );
    expect(phoneInput).toHaveValue("12345");
    expect(updatePhoneNumberMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Student number" })).not.toBeInTheDocument();
  });

  it("saves a valid phone number and refreshes the displayed profile", async () => {
    const updatedProfile = { ...profile, phoneNumber: "+84901234567" };
    getProfileMock.mockResolvedValueOnce(profile);
    updatePhoneNumberMock.mockResolvedValueOnce(updatedProfile);
    renderWithProviders(<ProfilePage />);

    fireEvent.click(await screen.findByRole("button", { name: "Edit phone number" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Phone number" }), {
      target: { value: "+84901234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("+84901234567")).toBeInTheDocument();
    expect(screen.getByText("Phone number updated successfully.")).toBeInTheDocument();
    expect(updatePhoneNumberMock).toHaveBeenCalledWith("+84901234567");
    expect(screen.getByText("22120001")).toBeInTheDocument();
    expect(screen.getByText("Faculty of Science")).toBeInTheDocument();
  });

  it("discards unsaved edits when canceled", async () => {
    getProfileMock.mockResolvedValueOnce(profile);
    renderWithProviders(<ProfilePage />);

    fireEvent.click(await screen.findByRole("button", { name: "Edit phone number" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Phone number" }), {
      target: { value: "0911111111" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("0901234567")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Phone number" })).not.toBeInTheDocument();
    expect(updatePhoneNumberMock).not.toHaveBeenCalled();
  });

  it("shows save errors and keeps the entered phone number for correction", async () => {
    getProfileMock.mockResolvedValueOnce(profile);
    updatePhoneNumberMock.mockRejectedValueOnce(new Error("Phone number already in use"));
    renderWithProviders(<ProfilePage />);

    fireEvent.click(await screen.findByRole("button", { name: "Edit phone number" }));
    const phoneInput = screen.getByRole("textbox", { name: "Phone number" });
    fireEvent.change(phoneInput, { target: { value: "0911111111" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Phone number already in use",
    );
    expect(phoneInput).toHaveValue("0911111111");
  });
});
