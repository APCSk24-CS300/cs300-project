/** A university service ready to render. `href` is always an http(s) URL. */
export type UniversityService = {
  id: string;
  name: string;
  description: string | null;
  href: string;
  icon: { src: string; alt: string };
  displayOrder: number;
  isActive: boolean;
  version: number;
};
