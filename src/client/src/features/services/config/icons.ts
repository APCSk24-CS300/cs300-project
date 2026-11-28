/** Icons for known services, matched by a slug of the service name. Others get the generic icon. */
const SERVICE_ICONS: Record<string, string> = {
  moodle: "/images/services/moodle.png",
  "student-portal": "/images/services/portal.png",
  "tuition-payment": "/images/services/tuition.png",
  "hcmus-website": "/images/services/website.png",
  hcmus: "/images/services/website.png",
  "hcmus-library": "/images/services/library.svg",
  library: "/images/services/library.svg",
  "it-support": "/images/services/support.svg",
  "course-registration-portal": "/images/services/portal.png",
  "special-programs-portal": "/images/services/portal.png",
  "student-handbook-2025": "/images/services/library.svg",
};

export const DEFAULT_SERVICE_ICON = "/images/services/default.svg";

export function slugifyServiceName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function serviceIconFor(name: string): string {
  return SERVICE_ICONS[slugifyServiceName(name)] ?? DEFAULT_SERVICE_ICON;
}
