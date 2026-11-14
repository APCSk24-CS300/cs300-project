export type SectionId =
  | "home"
  | "about"
  | "activities"
  | "services"
  | "help"
  | "contact";

export type NavigationLink = {
  id: SectionId;
  label: string;
  href: `#${SectionId}`;
};
