import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { FeatureCard } from "@/features/landing/components/FeatureCard";
import {
  HIGHLIGHTS,
  HIGHLIGHTS_CONTENT,
} from "@/features/landing/config/highlights";

export function HighlightsSection() {
  return (
    <section
      id="about"
      aria-labelledby="highlights-heading"
      tabIndex={-1}
      className="relative z-10 -mt-16 scroll-mt-[calc(var(--header-height)+2rem)] pb-16"
    >
      <Container>
        <SurfaceCard className="px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
          <SectionHeader
            id="highlights-heading"
            eyebrow={HIGHLIGHTS_CONTENT.eyebrow}
            title={HIGHLIGHTS_CONTENT.title}
            description={HIGHLIGHTS_CONTENT.description}
            align="split"
          />
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {HIGHLIGHTS.map((highlight) => (
              <FeatureCard key={highlight.id} highlight={highlight} />
            ))}
          </div>
        </SurfaceCard>
      </Container>
    </section>
  );
}
