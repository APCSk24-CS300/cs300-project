import { mapServiceListDTO } from "@/features/services/mappers/service.mapper";
import { mockDelay, mockServiceLinkStore } from "@/features/services/services/mock.store";
import type { HubService } from "@/features/services/services/hub.service";
import type { UniversityService } from "@/features/services/types/service";

/** Mock-mode hub: active links from the shared in-memory store. */
export class MockHubService implements HubService {
  private readonly delayMs: number;

  constructor(delayMs = 200) {
    this.delayMs = delayMs;
  }

  async listServices(signal?: AbortSignal): Promise<UniversityService[]> {
    await mockDelay(this.delayMs, signal);
    return mapServiceListDTO(mockServiceLinkStore.links.filter((l) => l.isActive));
  }
}
