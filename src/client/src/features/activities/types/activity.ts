export type RegistrationStatus = "open" | "upcoming" | "closed";

export type Activity = {
  id: string;
  title: string;
  imageUrl: string | null;
  categories: string[];
  startTime: Date;
  endTime: Date;
  location: string | null;
  registrationStatus: RegistrationStatus;
  href: string;
};

export type LandingActivities = {
  featured: Activity[];
  upcoming: Activity[];
};
