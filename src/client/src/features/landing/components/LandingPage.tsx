import { ActivitiesSection } from "@/features/activities";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FOOTER_CONTENT } from "@/features/landing/config/footer";
import { LANDING_NAV_LINKS } from "@/features/landing/config/nav";
import { HelpSection } from "@/features/landing/components/HelpSection";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { HighlightsSection } from "@/features/landing/components/HighlightsSection";
import { ServicesSection } from "@/features/landing/components/ServicesSection";

export function   LandingPage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-primary shadow-card focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <SiteHeader links={LANDING_NAV_LINKS} />
      <main id="main-content">
        <HeroSection />
        <HighlightsSection />
        <ActivitiesSection />
        <ServicesSection />
        <HelpSection />
      </main>
      <SiteFooter content={FOOTER_CONTENT} />
    </>
  );
}
