export type GuideEntry = {
  id: string;
  title: string;
  subtitle: string;
  href: string | null;
  available: boolean;
};

export const HELP_CONTENT = {
  eyebrow: "Help / Guide",
  title: "Find quick guides and answers to common questions.",
  unavailableLabel: "Coming soon",
};

export const GUIDES: GuideEntry[] = [
  {
    id: "getting-started",
    title: "GETTING STARTED",
    subtitle: "Learn the basics",
    href: null,
    available: false,
  },
  {
    id: "activities",
    title: "ACTIVITIES",
    subtitle: "How to register?",
    href: null,
    available: false,
  },
  {
    id: "training-score",
    title: "TRAINING SCORE",
    subtitle: "Track your DRS",
    href: null,
    available: false,
  },
  {
    id: "faq",
    title: "FAQ",
    subtitle: "Common questions",
    href: null,
    available: false,
  },
];
