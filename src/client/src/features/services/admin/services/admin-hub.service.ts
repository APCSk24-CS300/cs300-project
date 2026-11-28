import { mapServiceDTO, mapServiceListDTO } from "@/features/services/mappers/service.mapper";
import type { UniversityService } from "@/features/services/types/service";
import type {
  CreateServiceLinkDTO,
  UniversityServiceDTO,
  UpdateServiceLinkDTO,
} from "@/features/services/types/service.dto";
import { ApiError, api, unwrapServiceResponse, type ServiceResponseEnvelope } from "@/libs/api-client";

/** Administration of service links (BR-ADM-01). Each change returns the saved link with its new version. */
export interface AdminHubService {
  listAll(): Promise<UniversityService[]>;
  create(body: CreateServiceLinkDTO): Promise<UniversityService>;
  /** `version` is sent as If-Match; a stale version fails with ApiError `PRECONDITION_FAILED` (412). */
  update(id: string, body: UpdateServiceLinkDTO, version: number): Promise<UniversityService>;
  deactivate(id: string, version: number): Promise<UniversityService>;
}

type LinkEnvelope = ServiceResponseEnvelope<UniversityServiceDTO>;

function toLink(envelope: LinkEnvelope): UniversityService {
  const link = mapServiceDTO(unwrapServiceResponse(envelope));
  if (!link) throw new ApiError({ status: 200, code: "UNKNOWN", message: "The server sent an invalid service link" });
  return link;
}

const linkPath = (id: string) => `/admin/services/${encodeURIComponent(id)}`;
const ifMatch = (version: number) => ({ "If-Match": `"${version}"` });

export class RealAdminHubService implements AdminHubService {
  async listAll() {
    const envelope = await api.get<ServiceResponseEnvelope<UniversityServiceDTO[]>>("/admin/services?includeInactive=true");
    return mapServiceListDTO(unwrapServiceResponse(envelope));
  }

  async create(body: CreateServiceLinkDTO) {
    return toLink(await api.post<LinkEnvelope>("/admin/services", body));
  }

  async update(id: string, body: UpdateServiceLinkDTO, version: number) {
    return toLink(await api.patch<LinkEnvelope>(linkPath(id), body, { headers: ifMatch(version) }));
  }

  async deactivate(id: string, version: number) {
    return toLink(await api.delete<LinkEnvelope>(linkPath(id), { headers: ifMatch(version) }));
  }
}

export const adminHubService: AdminHubService = new RealAdminHubService();
