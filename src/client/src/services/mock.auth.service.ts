
import type {
  AuthResponse, ChangePasswordRequest, ForgotPasswordRequest, 
  LoginRequest, MessageResponse, ResetPasswordRequest, } from "@/types/dtos/auth.dto";

import type { SessionUser, StudentSessionUser } from "@/types";
import { Session } from "inspector/promises";
import { ROLE_CODES } from "@/libs/roles";


 class MockAuthService {
  async login(data: LoginRequest): Promise<AuthResponse> {
    console.log("MockAuthService.login called with data:", data);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

    if (data.role == ROLE_CODES[0] &&  data.email == "khangthinh111555@gmail.com" && data.password == "123456") {
        const user: StudentSessionUser = {
            studentNumber: "123456789",
            email: data.email,
            role: "student",
            facultyId: 1,
            fullName: "Khang Thinh",
            avatarUrl: null,
            userId: 1,
            permissions: [],
        };
        return { user };
    }
    throw new Error("Invalid email or password or role");
  }

  
  async logout(): Promise<void> {
    console.log("MockAuthService.logout called");
    return;
  }

  async getMe(): Promise<SessionUser> {
    console.log("MockAuthService.getMe called");
    return {
        userId: 1,
        email: 'asdasdasdasd@sdasd',
        fullName: "Test Student",
        role: "student",
        permissions: [],
        studentNumber: "123456789",
        facultyId: 1,
        avatarUrl: null,
        
    };
}
}

export const mockAuthService = new MockAuthService();
