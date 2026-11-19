export const ACTIVITIES_SECTION = {
  eyebrow: "ACTIVITY DISCOVERY",
  title: "Featured & Upcoming Activities",
  loadingAnnouncement: "Loading activities.",
  successAnnouncement: "Activities loaded.",
  emptyAnnouncement: "No activities are available right now.",
  errorAnnouncement: "Activities could not be loaded.",
  empty: {
    title: "No activities available right now",
    description:
      "New activities will appear here as soon as they are announced. Please check back soon.",
  },
  error: {
    title: "We couldn't load activities",
    description: "Please check your connection and try again.",
    retryLabel: "Try again",
  },
} as const;

export const REGISTRATION_STATUS_LABELS = {
  open: "Registration Open",
  upcoming: "Registration Upcoming",
  closed: "Registration Closed",
} as const;

export const ACTIVITY_VIEW_LABEL = "View";
