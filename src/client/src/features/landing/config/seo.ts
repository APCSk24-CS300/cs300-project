import type { Metadata } from "next";

export const LANDING_METADATA: Metadata = {
  title: "myHCMUS — Extracurricular activities & training scores",
  description:
    "Discover extracurricular activities, manage participation, and track student training scores at HCMUS.",
  openGraph: {
    title: "myHCMUS — Extracurricular activities & training scores",
    description:
      "Discover extracurricular activities, manage participation, and track student training scores at HCMUS.",
    images: [
      {
        url: "/images/landing/hero.png",
        width: 1303,
        height: 814,
        alt: "HCMUS campus",
      },
    ],
    type: "website",
  },
};
