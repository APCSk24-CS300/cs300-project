import { mapServiceListDTO } from "@/features/services/mappers/service.mapper";
import type { UniversityService } from "@/features/services/types/service";
import type { UniversityServiceDTO } from "@/features/services/types/service.dto";
import { api, unwrapServiceResponse, type ServiceResponseEnvelope } from "@/libs/api-client";

/** Reads the University Services Hub (UC-07). */
export interface HubService {
  /** Active services in hub order. */
  listServices(): Promise<UniversityService[]>;
}

/**
 * Calls `GET /hub/services` through the single API client. Mock mode: the MSW hub handlers answer;
 * real mode: the backend, through the same-origin /api/backend forwarder.
 */
export class RealHubService implements HubService {
  async listServices(): Promise<UniversityService[]> {
    const envelope = await api.get<ServiceResponseEnvelope<UniversityServiceDTO[]>>("/hub/services");
    return mapServiceListDTO(unwrapServiceResponse(envelope));
  }
}

export const hubService: HubService = new RealHubService();
