import { mapServiceDTO, mapServiceListDTO } from "@/features/services/mappers/service.mapper";
import type { UniversityService } from "@/features/services/types/service";
import type {
  BackendEnvelope,
  CreateServiceLinkDTO,
  UniversityServiceDTO,
  UpdateServiceLinkDTO,
} from "@/features/services/types/service.dto";
import { api } from "@/libs/api-client";

/** Administration of service links (BR-ADM-01). Each change returns the saved link with its new version. */
export interface AdminHubService {
  listAll(signal?: AbortSignal): Promise<UniversityService[]>;
  create(body: CreateServiceLinkDTO): Promise<UniversityService>;
  /** `version` is sent as If-Match; a stale version fails with ApiError status 412. */
  update(id: string, body: UpdateServiceLinkDTO, version: number): Promise<UniversityService>;
  deactivate(id: string, version: number): Promise<UniversityService>;
}

function unwrap(body: BackendEnvelope<UniversityServiceDTO> | undefined): UniversityService {
  const link = body?.payload?.data ? mapServiceDTO(body.payload.data) : null;
  if (!link) throw new Error("The server sent an invalid service link");
  return link;
}

export class RealAdminHubService implements AdminHubService {
  async listAll(signal?: AbortSignal) {
    const res = await api.get<BackendEnvelope<UniversityServiceDTO[]>>("/admin/services?includeInactive=true", { signal });
    return mapServiceListDTO(res?.payload?.data);
  }

  async create(body: CreateServiceLinkDTO) {
    const res = await api.request<BackendEnvelope<UniversityServiceDTO>>("/admin/services", "POST", { body });
    return unwrap(res.data);
  }

  async update(id: string, body: UpdateServiceLinkDTO, version: number) {
    const res = await api.request<BackendEnvelope<UniversityServiceDTO>>(`/admin/services/${encodeURIComponent(id)}`, "PATCH", {
      body,
      headers: { "If-Match": `"${version}"` },
    });
    return unwrap(res.data);
  }

  async deactivate(id: string, version: number) {
    const res = await api.request<BackendEnvelope<UniversityServiceDTO>>(`/admin/services/${encodeURIComponent(id)}`, "DELETE", {
      headers: { "If-Match": `"${version}"` },
    });
    return unwrap(res.data);
  }
}
