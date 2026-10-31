// Login, Logout, Forgot Password, Reset Password, Change Password, Get current user
import { api } from "@/libs/api-client";
import type {
  AuthResponse, ChangePasswordRequest, ForgotPasswordRequest, 
  LoginRequest, MessageResponse, ResetPasswordRequest, } from "@/types/dtos/auth.dto";

import type { SessionUser } from "@/types";

const BASE = "/auth";

 class AuthService {
  async login(data: LoginRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>(`${BASE}/login`, data);
  }

  async logout(): Promise<void> {
    return api.post<void>(`${BASE}/logout`);
  }

  async getMe(): Promise<SessionUser> {
    return api.get<SessionUser>(`${BASE}/me`);
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
    return api.post<MessageResponse>(`${BASE}/forgot-password`, data);
  }

  async resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
    return api.post<MessageResponse>(`${BASE}/reset-password`, data);
  }

  async changePassword(data: ChangePasswordRequest): Promise<MessageResponse> {
    return api.post<MessageResponse>(`${BASE}/change-password`, data);
  }
}

export const authService = new AuthService();

