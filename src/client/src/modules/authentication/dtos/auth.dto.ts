import type { SessionUser } from "@/types/auth";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: SessionUser;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}