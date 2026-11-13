export type RegistrationStatusDTO = "open" | "upcoming" | "closed";

export type ActivityDTO = {
  id: string;
  title: string;
  image_url?: string | null;
  categories?: string[] | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  registration_status: RegistrationStatusDTO;
};

export type GroupedLandingActivitiesDTO = {
  featured?: ActivityDTO[] | null;
  upcoming?: ActivityDTO[] | null;
};

export type ListLandingActivitiesDTO = {
  activities: ActivityDTO[];
};

export type LandingActivitiesDTO =
  | GroupedLandingActivitiesDTO
  | ListLandingActivitiesDTO;

export type LandingActivitiesResponseDTO = {
  data: LandingActivitiesDTO;
};
