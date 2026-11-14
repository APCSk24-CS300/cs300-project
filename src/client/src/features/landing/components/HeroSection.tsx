import { Container } from "@/components/ui/Container";
import { HERO_CONTENT } from "@/features/landing/config/hero";
import { HeroActions } from "@/features/landing/components/HeroActions";
import { HeroVisual } from "@/features/landing/components/HeroVisual";

export function HeroSection() {
  return (
    <section
      id="home"
      aria-labelledby="hero-heading"
      tabIndex={-1}
      className="relative isolate flex min-h-[560px] scroll-mt-[calc(var(--header-height)+2rem)] items-center overflow-hidden pb-32 pt-36"
    >
      <HeroVisual
        src={HERO_CONTENT.image.src}
        alt={HERO_CONTENT.image.alt}
      />
      <Container className="relative">
        <div className="max-w-xl lg:max-w-4xl">
        <h1
            id="hero-heading"
            className="text-4xl font-extrabold leading-tight tracking-tight text-[#FFA800] [text-shadow:4px_4px_1px_rgba(0,0,0,0.9)] sm:text-5xl lg:text-6xl"
          >
            {HERO_CONTENT.headline}
          </h1>
          <p className="mt-3 max-w-md text-base leading-7 text-text sm:text-lg">
            {HERO_CONTENT.subtitle}
          </p>
          <HeroActions activitiesHref={HERO_CONTENT.activitiesHref} />
        </div>
      </Container>
    </section>
  );
}
