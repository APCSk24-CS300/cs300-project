import { ApiError, api, unwrap } from "@/libs/api-client";
import { profileFromEnvelope } from "@/features/profile/mappers/profile.mapper";
import type { Profile } from "@/features/profile/types/profile";

/**
 * UC-03 profile operations through the single API client (plan 006 §6): paths are relative to the base
 * URL, so mock mode (MSW) and real mode (the /api/backend forwarder) are the same code.
 * Password changes live in the auth service (`authService.changePassword`, one service for the 003
 * first-sign-in flow and the profile; plan 006 O3).
 */
export interface ProfileService {
  getProfile(): Promise<Profile>;
  updatePhoneNumber(phoneNumber: string | null): Promise<Profile>;
  /** Returns the saved avatar URL (BE-relative, `/api/v1/profile/avatar/files/{name}`). */
  uploadAvatar(file: File): Promise<string>;
  removeAvatar(): Promise<void>;
}

export class RealProfileService implements ProfileService {
  async getProfile(): Promise<Profile> {
    return profileFromEnvelope(await api.get<unknown>("/profile"));
  }

  async updatePhoneNumber(phoneNumber: string | null): Promise<Profile> {
    return profileFromEnvelope(await api.patch<unknown>("/profile", { phoneNumber }));
  }

  async uploadAvatar(file: File): Promise<string> {
    const form = new FormData();
    form.append("avatar", file);
    const data = unwrap(await api.post<{ success: boolean; data?: { avatarUrl?: unknown } }>("/profile/avatar", form));
    if (typeof data?.avatarUrl !== "string") {
      throw new ApiError({ status: 200, code: "UNKNOWN", message: "Invalid avatar response" });
    }
    return data.avatarUrl;
  }

  async removeAvatar(): Promise<void> {
    await api.delete<{ success: boolean; message?: string }>("/profile/avatar");
  }
}

export const profileService: ProfileService = new RealProfileService();
