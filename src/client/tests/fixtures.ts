import { vi } from "vitest";
import type { AuthContextValue } from "@/features/auth/context/AuthContext";
import type { SessionUser } from "@/features/auth/types/auth";
import type { Activity, LandingActivities } from "@/features/activities/types";
import type { ActivityDTO } from "@/features/activities/types";
import type { RoleCode } from "@/libs/roles";

export function createActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "act-001",
    title: "Sample Activity",
    imageUrl: "/images/landing/activity-placeholder.png",
    categories: ["Academic"],
    startTime: new Date("2026-10-17T08:00:00+07:00"),
    endTime: new Date("2026-10-17T10:00:00+07:00"),
    location: "I.32, HCMUS",
    registrationStatus: "open",
    href: "/activities/act-001",
    ...overrides,
  };
}

export function createActivityDTO(
  overrides: Partial<ActivityDTO> = {},
): ActivityDTO {
  return {
    id: "act-001",
    title: "Sample Activity",
    image_url: "/images/landing/activity-placeholder.png",
    categories: ["Academic"],
    start_time: "2026-10-17T08:00:00+07:00",
    end_time: "2026-10-17T10:00:00+07:00",
    location: "I.32, HCMUS",
    registration_status: "open",
    ...overrides,
  };
}

export function createLandingActivities(
  overrides: Partial<LandingActivities> = {},
): LandingActivities {
  return {
    featured: [createActivity()],
    upcoming: [],
    ...overrides,
  };
}

export function createSessionUser(role: RoleCode): SessionUser {
  const base = {
    userId: role === "student" ? 1 : role === "manager" ? 2 : 3,
    email: `${role}@hcmus.edu.vn`,
    fullName: `Test ${role}`,
    avatarUrl: null,
    permissions: [],
  };

  if (role === "student") {
    return {
      ...base,
      role,
      studentNumber: "22120001",
      facultyId: 1,
    };
  }

  return {
    ...base,
    role,
    studentNumber: null,
    facultyId: null,
  };
}

export function createAuthContextValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(async () => createSessionUser("student")),
    logout: vi.fn(async () => undefined),
    refreshUser: vi.fn(async () => undefined),
    ...overrides,
  };
}
