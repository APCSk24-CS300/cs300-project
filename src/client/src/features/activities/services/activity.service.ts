import { mapLandingActivitiesDTO } from "@/features/activities/mappers/activity.mapper";
import type {
  LandingActivities,
  LandingActivitiesResponseDTO,
} from "@/features/activities/types";
import { api } from "@/libs/api-client";

export interface ActivityService {
  getLandingActivities(signal?: AbortSignal): Promise<LandingActivities>;
}

export class RealActivityService implements ActivityService {
  async getLandingActivities(signal?: AbortSignal): Promise<LandingActivities> {
    const response = await api.get<LandingActivitiesResponseDTO>(
      "/activities/landing",
      { signal },
    );

    return mapLandingActivitiesDTO(response?.data);
  }
}
