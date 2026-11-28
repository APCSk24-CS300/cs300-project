"use client";

import { Button } from "@/components/ui/Button";
import { HERO_CONTENT } from "@/features/landing/config/hero";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPath } from "@/libs/navigation";
import { scrollToSection } from "@/libs/scroll";

type HeroActionsProps = {
  activitiesHref: string;
};

export function HeroActions({ activitiesHref }: HeroActionsProps) {
  const { user, isAuthenticated } = useAuth();
  const getStartedHref =
    isAuthenticated && user ? getDashboardPath(user.role) : "/login";

  if (activitiesHref.startsWith("#")) {
    const sectionId = activitiesHref.slice(1);

    return (
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button href={getStartedHref} variant="white" size="lg">
          {HERO_CONTENT.primaryCta}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => scrollToSection(sectionId)}
        >
          {HERO_CONTENT.secondaryCta}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
      <Button href={getStartedHref} variant="white" size="lg">
        {HERO_CONTENT.primaryCta}
      </Button>
      <Button href={activitiesHref} variant="secondary" size="lg">
        {HERO_CONTENT.secondaryCta}
      </Button>
    </div>
  );
}
