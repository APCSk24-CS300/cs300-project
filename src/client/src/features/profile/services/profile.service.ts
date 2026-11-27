import { api } from "@/libs/api-client";
import type { Profile, ProfileResponseDTO } from "@/features/profile/types/profile";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function mapProfile(value: unknown): Profile {
  if (
    !isRecord(value) ||
    typeof value.email !== "string" ||
    typeof value.fullName !== "string" ||
    !isNullableString(value.phoneNumber) ||
    (value.avatarUrl !== undefined && !isNullableString(value.avatarUrl))
  ) {
    throw new Error("The profile response is invalid");
  }

  let academicInfo: Profile["academicInfo"] = null;
  if (value.academicInfo !== null && value.academicInfo !== undefined) {
    if (!isRecord(value.academicInfo)) {
      throw new Error("The profile response is invalid");
    }

    const studentNumber = value.academicInfo.studentNumber;
    const faculty = value.academicInfo.faculty;
    if (!isNullableString(studentNumber)) {
      throw new Error("The profile response is invalid");
    }

    let facultyInfo: NonNullable<Profile["academicInfo"]>["faculty"] = null;
    if (faculty !== null && faculty !== undefined) {
      if (!isRecord(faculty) || typeof faculty.name !== "string") {
        throw new Error("The profile response is invalid");
      }
      facultyInfo = { name: faculty.name };
    }

    academicInfo = { studentNumber, faculty: facultyInfo };
  }

  return {
    email: value.email,
    fullName: value.fullName,
    phoneNumber: value.phoneNumber,
    avatarUrl: typeof value.avatarUrl === "string" ? value.avatarUrl : null,
    academicInfo,
  };
}

function getProfileData(response: ProfileResponseDTO): unknown {
  if (!response.success) {
    throw new Error("The profile request was unsuccessful");
  }

  if ("payload" in response) {
    return response.payload.data;
  }

  return response.data;
}

export interface ProfileService {
  getProfile(signal?: AbortSignal): Promise<Profile>;
}

export class RealProfileService implements ProfileService {
  async getProfile(signal?: AbortSignal): Promise<Profile> {
    const response = await api.get<ProfileResponseDTO>("/api/v1/profile", {
      signal,
    });

    return mapProfile(getProfileData(response));
  }
}

export const profileService: ProfileService = new RealProfileService();
