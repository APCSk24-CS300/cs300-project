import { MockHubService } from "@/features/services/services/mock.hub.service";
import { RealHubService, type HubService } from "@/features/services/services/hub.service";
import { getDataSource } from "@/libs/service-mode";

export function createHubService(): HubService {
  return getDataSource() === "api" ? new RealHubService() : new MockHubService();
}
