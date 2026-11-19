import { MockActivityService } from "@/features/activities/services/mock.activity.service";
import { RealActivityService } from "@/features/activities/services/activity.service";
import type { ActivityService } from "@/features/activities/services/activity.service";
import { getDataSource } from "@/libs/service-mode";

export function createActivityService(): ActivityService {
  return getDataSource() === "api"
    ? new RealActivityService()
    : new MockActivityService();
}
