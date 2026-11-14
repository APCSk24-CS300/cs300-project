import type {
  AuthResponse,
  LoginRequest,
} from "@/features/auth/types/auth.dto";
import type {
  SessionUser,
  StaffSessionUser,
  StudentSessionUser,
} from "@/features/auth/types";
import { ROLE_CODES } from "@/libs/roles";

type MockAuthScenario = "guest" | "student" | "manager" | "admin";

function getScenario(): MockAuthScenario {
  const value = process.env.NEXT_PUBLIC_MOCK_AUTH_STATE;

  if (value === "guest" || value === "manager" || value === "admin") {
    return value;
  }

  return "student";
}

function createUser(scenario: Exclude<MockAuthScenario, "guest">): SessionUser {
  if (scenario === "student") {
    const user: StudentSessionUser = {
      studentNumber: "123456789",
      email: "khangthinh111555@gmail.com",
      role: "student",
      facultyId: 1,
      fullName: "Khang Thinh",
      avatarUrl: null,
      userId: 1,
      permissions: [],
    };

    return user;
  }

  const user: StaffSessionUser = {
    userId: scenario === "manager" ? 2 : 3,
    email: `${scenario}@hcmus.edu.vn`,
    fullName: scenario === "manager" ? "Mock Manager" : "Mock Admin",
    role: scenario,
    permissions: [],
    studentNumber: null,
    facultyId: null,
    avatarUrl: null,
  };

  return user;
}

class MockAuthService {
  async login(data: LoginRequest): Promise<AuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (
      data.role === ROLE_CODES[0] &&
      data.email === "khangthinh111555@gmail.com" &&
      data.password === "123456"
    ) {
      return { user: createUser("student") };
    }

    throw new Error("Invalid email or password or role");
  }

  async logout(): Promise<void> {
    return;
  }

  async getMe(): Promise<SessionUser> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const scenario = getScenario();

    if (scenario === "guest") {
      throw new Error("No active mock session");
    }

    return createUser(scenario);
  }
}

export const mockAuthService = new MockAuthService();
