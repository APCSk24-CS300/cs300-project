import type { components } from "@/types/openapi.gen";

type Schemas = components["schemas"];

export type AdminUserDTO = Schemas["AdminUser"];
export type UserListResponseDTO = Schemas["UserListResponse"];
export type AdminUserResponseDTO = Schemas["AdminUserResponse"];
export type FacultySummaryDTO = Schemas["FacultySummary"];
export type RoleDTO = Schemas["Role"];
export type RolePermissionsResponseDTO = Schemas["RolePermissionsResponse"];
export type { CreateUserRequestWithPassword } from "@/types/openapi-gaps";

export interface FacultyListResponseDTO {
  success?: boolean;
  data?: FacultySummaryDTO[];
}

export interface RoleListResponseDTO {
  success: boolean;
  data: RoleDTO[];
}
