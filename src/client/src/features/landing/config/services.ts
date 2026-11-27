import type { ServiceCardData } from "@/features/services/components/ServiceCard";

/**
 * Guest preview of the landing services section. Names and icons only: guests never get links,
 * because the hub requires login (UC-07). Signed-in users see live data from the hub instead.
 */
export type ServicePreview = Omit<ServiceCardData, "href" | "description">;

export const SERVICES_CONTENT = {
  eyebrow: "HCMUS SERVICES",
  title: "Quick access to essential university services",
  loginMoreLabel: "Log in for more",
  seeAllLabel: "See all services",
  errorLabel: "University services couldn't be loaded.",
  retryLabel: "Try again",
  emptyLabel: "No university services are available yet.",
};

/** How many live cards the landing page shows before "See all services". */
export const LANDING_SERVICE_LIMIT = 6;

export const SERVICES: ServicePreview[] = [
  { id: "moodle", name: "Moodle", icon: { src: "/images/services/moodle.png", alt: "" } },
  { id: "tuition-payment", name: "Tuition Payment", icon: { src: "/images/services/tuition.png", alt: "" } },
  { id: "student-portal", name: "Student Portal", icon: { src: "/images/services/portal.png", alt: "" } },
  { id: "hcmus-website", name: "HCMUS Website", icon: { src: "/images/services/website.png", alt: "" } },
  { id: "hcmus-library", name: "HCMUS Library", icon: { src: "/images/services/library.svg", alt: "" } },
  { id: "it-support", name: "IT Support", icon: { src: "/images/services/support.svg", alt: "" } },
];
