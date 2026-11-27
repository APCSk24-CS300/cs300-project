/** A university service as the backend sends it (`UniversityService` in docs/api/openapi.yaml). */
export type UniversityServiceDTO = {
  id: string;
  name: string;
  description: string | null;
  url: string;
  displayOrder: number;
  isActive: boolean;
  version: number;
};

/** The backend's response envelope (`ServiceResponse.get()` in src/server). */
export type BackendEnvelope<T> = {
  success: boolean;
  statusCode: number;
  payload: { message: string; data?: T };
};

/** Body of POST /admin/services. */
export type CreateServiceLinkDTO = {
  name: string;
  url: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  reason?: string;
};

/** Body of PATCH /admin/services/{id}. */
export type UpdateServiceLinkDTO = Partial<CreateServiceLinkDTO>;
