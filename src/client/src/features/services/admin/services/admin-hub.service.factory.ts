import { MockAdminHubService } from "@/features/services/admin/services/mock.admin-hub.service";
import { RealAdminHubService, type AdminHubService } from "@/features/services/admin/services/admin-hub.service";
import { getDataSource } from "@/libs/service-mode";

export function createAdminHubService(): AdminHubService {
  return getDataSource() === "api" ? new RealAdminHubService() : new MockAdminHubService();
}
