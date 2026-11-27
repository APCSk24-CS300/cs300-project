import type { components } from "@/types/openapi.gen";

export type {
  CurrentUserContextWithGaps,
  LoginRequest,
  LoginResponse,
  ProfileWithGaps,
} from "@/types/openapi-gaps";

export type ChangePasswordRequestDTO = components["schemas"]["ChangePasswordRequest"];
export type ApiMessageDTO = components["schemas"]["ApiMessage"];
