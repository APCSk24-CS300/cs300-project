export type Highlight = {
  id: string;
  title: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
};

export const HIGHLIGHTS_CONTENT = {
  eyebrow: "PLATFORM HIGHLIGHTS",
  title: "Built to make campus life easier",
  description:
    "Bring activities, participation, training scores, and essential campus services together in one place, making student life easier to manage and stay connected.",
};

export const HIGHLIGHTS: Highlight[] = [
  {
    id: "discover",
    title: "Discover & Join Activities",
    description:
      "Discover extracurricular activities, register for opportunities, and manage your participation with ease.",
    image: {
      src: "/images/landing/highlight-activities.png",
      alt: "Students collaborating during a campus activity",
    },
  },
  {
    id: "journey",
    title: "Track Your Student Journey",
    description:
      "Keep track of your activities, attendance, training scores, and academic schedule in one place.",
    image: {
      src: "/images/landing/highlight-journey.png",
      alt: "Students studying together on campus",
    },
  },
  {
    id: "campus",
    title: "Stay Connected with Campus",
    description:
      "Stay informed with timely notifications, university services, and personalized activity recommendations.",
    image: {
      src: "/images/landing/highlight-campus.png",
      alt: "HCMUS campus facilities and green courtyard",
    },
  },
];
