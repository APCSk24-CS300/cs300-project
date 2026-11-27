import { mapServiceListDTO } from "@/features/services/mappers/service.mapper";
import type { UniversityService } from "@/features/services/types/service";
import type { BackendEnvelope, UniversityServiceDTO } from "@/features/services/types/service.dto";
import { api } from "@/libs/api-client";

/** Reads the University Services Hub (UC-07). */
export interface HubService {
  /** Active services in hub order. */
  listServices(signal?: AbortSignal): Promise<UniversityService[]>;
}

/** Calls `GET /hub/services` on the backend (through /api/backend in the browser). */
export class RealHubService implements HubService {
  async listServices(signal?: AbortSignal): Promise<UniversityService[]> {
    const response = await api.get<BackendEnvelope<UniversityServiceDTO[]>>("/hub/services", { signal });
    return mapServiceListDTO(response?.payload?.data);
  }
}
