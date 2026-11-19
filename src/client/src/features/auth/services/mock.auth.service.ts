
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

interface MockAccount {
  email: string;
  password: string;
  role: LoginRequest["role"];
  scenario: Exclude<MockAuthScenario, "guest">;
}

class MockAuthService {
  private readonly loginDelay = 300;
  private readonly sessionDelay = 150;

  private readonly accounts: MockAccount[] = [
    {
      email: "nguyenvana@gmail.com",
      password: "123456",
      role: ROLE_CODES[0],
      scenario: "student",
    },
    {
      email: "manager@hcmus.edu.vn",
      password: "123456",
      role: ROLE_CODES[1],
      scenario: "manager",
    },
    {
      email: "admin.work@gmail.com",
      password: "123456",
      role: ROLE_CODES[1],
      scenario: "admin",
    },
  ];

  private readonly scenarios = new Set<MockAuthScenario>([
    "guest",
    "student",
    "manager",
    "admin",
  ]);

  private async delay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private getScenario(): MockAuthScenario {
    const value = process.env.NEXT_PUBLIC_MOCK_AUTH_STATE;

    if (value && this.scenarios.has(value as MockAuthScenario)) {
      return value as MockAuthScenario;
    }

    return "student";
  }

  private createStudent(): StudentSessionUser {
    return {
      studentNumber: "123456789",
      email: "nguyenvana@gmail.com",
      role: "student",
      facultyId: 1,
      fullName: "Nguyen Van A",
      avatarUrl: null,
      userId: 1,
      permissions: [],
    };
  }

  private createStaff(
    scenario: "manager" | "admin",
  ): StaffSessionUser {
    const isManager = scenario === "manager";

    return {
      userId: isManager ? 2 : 3,
      email: isManager
        ? "manager@hcmus.edu.vn"
        : "admin.work@gmail.com",
      fullName: isManager ? "Mock Manager" : "Mock Admin",
      role: scenario,
      permissions: [],
      studentNumber: null,
      facultyId: null,
      avatarUrl: null,
    };
  }

  private createUser(
    scenario: Exclude<MockAuthScenario, "guest">,
  ): SessionUser {
    if (scenario === "student") {
      return this.createStudent();
    }

    return this.createStaff(scenario);
  }

  private authenticate(data: LoginRequest): SessionUser {
    const account = this.accounts.find(
      (account) =>
        account.email === data.email &&
        account.password === data.password &&
        account.role === data.role,
    );

    if (!account) {
      throw new Error("Invalid email or password");
    }

    return this.createUser(account.scenario);
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    await this.delay(this.loginDelay);

    return {
      user: this.authenticate(data),
    };
  }

  async logout(): Promise<void> {
    await this.delay(100);
  }

  async getMe(): Promise<SessionUser> {
    await this.delay(this.sessionDelay);

    const scenario = this.getScenario();

    if (scenario === "guest") {
      throw new Error("No active mock session");
    }

    return this.createUser(scenario);
  }
}

export const mockAuthService = new MockAuthService();
