export type ServiceEntry = {
  id: string;
  name: string;
  href: string;
  icon: {
    src: string;
    alt: string;
  };
  access: "public" | "authenticated";
  available: boolean;
};

export const SERVICES_CONTENT = {
  eyebrow: "HCMUS SERVICES",
  title: "Quick access to essential university services",
  accessLabel: "Access",
  unavailableLabel: "Coming soon",
  externalLinkLabel: "opens in a new tab",
};

export const SERVICES: ServiceEntry[] = [
  {
    id: "moodle",
    name: "Moodle",
    href: "https://moodle.hcmus.edu.vn/",
    icon: { src: "/images/services/moodle.png", alt: "" },
    access: "public",
    available: true,
  },
  {
    id: "tuition-payment",
    name: "Tuition Payment",
    href: "https://hcmus.edu.vn/",
    icon: { src: "/images/services/tuition.png", alt: "" },
    access: "authenticated",
    available: true,
  },
  {
    id: "student-portal",
    name: "Student Portal",
    href: "https://portal.hcmus.edu.vn/",
    icon: { src: "/images/services/portal.png", alt: "" },
    access: "public",
    available: true,
  },
  {
    id: "hcmus-website",
    name: "HCMUS Website",
    href: "https://hcmus.edu.vn/",
    icon: { src: "/images/services/website.png", alt: "" },
    access: "authenticated",
    available: true,
  },
];
