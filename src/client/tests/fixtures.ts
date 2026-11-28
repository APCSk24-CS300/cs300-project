import { vi } from "vitest";
import type { AuthContextValue } from "@/features/auth/context/AuthContext";
import type { CurrentUser } from "@/features/auth/types/auth";
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

export function createCurrentUser(role: RoleCode, overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: role === "student" ? "user-001" : role === "manager" ? "user-002" : "user-003",
    email: `${role}@example.invalid`,
    fullName: `Test ${role}`,
    role,
    status: "active",
    avatarUrl: null,
    studentNumber: role === "student" ? "23127001" : null,
    faculty: role === "student" ? { id: "120", code: "CIT", name: "Computer and Information Technology field" } : null,
    permissions: [],
    mustChangePassword: false,
    ...overrides,
  };
}

/** Kept for existing tests. */
export const createSessionUser = createCurrentUser;

export function createAuthContextValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  const user = overrides.user ?? null;
  return {
    user,
    status: user ? "signedIn" : "signedOut",
    isAuthenticated: Boolean(user),
    isLoading: false,
    bootstrapError: null,
    signOutReason: null,
    login: vi.fn(async () => createCurrentUser("student")),
    logout: vi.fn(async () => "confirmed" as const),
    refresh: vi.fn(async () => user),
    refreshUser: vi.fn(async () => undefined),
    retryBootstrap: vi.fn(),
    changePassword: vi.fn(async () => createCurrentUser("student")),
    signOutLocally: vi.fn(),
    ...overrides,
  };
}
