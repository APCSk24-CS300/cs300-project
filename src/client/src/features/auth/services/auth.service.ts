import { api, unwrap } from "@/libs/api-client";
import type {
  ApiMessageDTO,
  ChangePasswordRequestDTO,
  CurrentUserContextWithGaps,
  LoginRequest,
  LoginResponse,
} from "@/features/auth/types/auth.dto";

/**
 * Auth service contract (constitution C-IV v1.1.0). One HTTP implementation; in mock mode
 * the MSW handlers in src/mocks/handlers/auth.ts answer the same requests.
 * Session callbacks are skipped: AuthProvider handles these errors itself.
 */
export interface AuthService {
  login(request: LoginRequest): Promise<LoginResponse["data"]>;
  logout(): Promise<void>;
  getCurrentUserContext(): Promise<CurrentUserContextWithGaps["data"]>;
  changePassword(request: ChangePasswordRequestDTO): Promise<void>;
}

const OWN_ERRORS = { skipSessionHandlers: true } as const;

class HttpAuthService implements AuthService {
  async login(request: LoginRequest) {
    return unwrap(await api.post<LoginResponse>("/auth/login", request, OWN_ERRORS));
  }

  async logout() {
    await api.post<ApiMessageDTO>("/auth/logout", undefined, OWN_ERRORS);
  }

  async getCurrentUserContext() {
    return unwrap(await api.get<CurrentUserContextWithGaps>("/auth/me", OWN_ERRORS));
  }

  async changePassword(request: ChangePasswordRequestDTO) {
    await api.patch<ApiMessageDTO>("/profile/password", request, OWN_ERRORS);
  }
}

export const authService: AuthService = new HttpAuthService();
