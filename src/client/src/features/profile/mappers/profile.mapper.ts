import { unwrap, unwrapServiceResponse, type ServiceResponseEnvelope } from "@/libs/api-client";
import type { Profile } from "@/features/profile/types/profile";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

/** Maps the BE / contract `Profile` to the view model; rejects anything malformed. */
export function mapProfile(value: unknown): Profile {
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
    const { studentNumber, faculty } = value.academicInfo;
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

/**
 * The profile body in either envelope: the BE's ServiceResponse (`payload.data`, what it sends today)
 * or the contract's `{ success, data }` (DOC-16/DOC-20). Uses the two shared adapters of the API client,
 * so there is still one place per envelope.
 */
export function profileFromEnvelope(body: unknown): Profile {
  if (isRecord(body) && isRecord(body.payload)) {
    return mapProfile(unwrapServiceResponse(body as unknown as ServiceResponseEnvelope<unknown>));
  }
  return mapProfile(unwrap((isRecord(body) ? body : {}) as { data?: unknown }));
}
