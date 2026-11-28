import { describe, expect, it } from "vitest";
import { mapProfile, profileFromEnvelope } from "@/features/profile/mappers/profile.mapper";

const body = {
  id: "u1",
  email: "student@example.edu",
  fullName: "Student Example",
  phoneNumber: "0901234567",
  avatarUrl: "/api/v1/profile/avatar/files/a.png",
  academicInfo: { studentNumber: "22120001", faculty: { id: "1", code: "S", name: "Faculty of Science" }, major: null, enrollmentYear: null },
};
const expected = {
  email: "student@example.edu",
  fullName: "Student Example",
  phoneNumber: "0901234567",
  avatarUrl: "/api/v1/profile/avatar/files/a.png",
  academicInfo: { studentNumber: "22120001", faculty: { name: "Faculty of Science" } },
};

describe("profile mapper (dev's envelope cases, moved from profile.service.test.ts)", () => {
  it("maps the BE ServiceResponse envelope (payload.data)", () => {
    expect(profileFromEnvelope({ success: true, statusCode: 200, payload: { message: "OK (OK)", data: body } })).toEqual(expected);
  });

  it("supports the documented success/data response", () => {
    expect(profileFromEnvelope({ success: true, data: body })).toEqual(expected);
  });

  it("rejects an invalid profile response", () => {
    expect(() => profileFromEnvelope({ success: true, data: { email: 1 } })).toThrow("The profile response is invalid");
    expect(() => profileFromEnvelope({ success: true, payload: { message: "OK" } })).toThrow();
    expect(() => mapProfile({ ...body, academicInfo: { studentNumber: 5 } })).toThrow("The profile response is invalid");
    expect(() => mapProfile({ ...body, academicInfo: { studentNumber: null, faculty: { id: "1" } } })).toThrow();
  });

  it("maps null academic info and a missing avatar to nulls", () => {
    expect(mapProfile({ ...body, academicInfo: null, avatarUrl: undefined })).toMatchObject({ academicInfo: null, avatarUrl: null });
  });
});
