import type { NavigationLink } from "@/types/navigation";

export type FooterContent = {
  brandDescription: string;
  contactHeading: string;
  address: string;
  phones: string[];
  email: string;
  quickLinksHeading: string;
  quickLinks: NavigationLink[];
  copyrightLabel: string;
};
