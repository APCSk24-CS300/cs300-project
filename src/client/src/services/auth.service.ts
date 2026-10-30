// Login, Logout, Forgot Password, Reset Password, Change Password, Get current user
import { api } from "@/lib/api-client";
import type {
  AuthResponse, ChangePasswordRequest, ForgotPasswordRequest, 
  LoginRequest, MessageResponse, ResetPasswordRequest, } from "@/types/dtos/auth.dto";

import type { SessionUser } from "@/types";

const BASE = "/auth";

 class AuthService {
  login(data: LoginRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>(`${BASE}/login`, data);
  }

  logout(): Promise<void> {
    return api.post<void>(`${BASE}/logout`);
  }

  getMe(): Promise<SessionUser> {
    return api.get<SessionUser>(`${BASE}/me`);
  }

  forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
    return api.post<MessageResponse>(`${BASE}/forgot-password`, data);
  }

  resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
    return api.post<MessageResponse>(`${BASE}/reset-password`, data);
  }

  changePassword(data: ChangePasswordRequest): Promise<MessageResponse> {
    return api.post<MessageResponse>(`${BASE}/change-password`, data);
  }
}

export const authService = new AuthService();

