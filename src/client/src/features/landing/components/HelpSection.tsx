import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GuideCard } from "@/features/landing/components/GuideCard";
import { GUIDES, HELP_CONTENT } from "@/features/landing/config/guides";

export function HelpSection() {
  return (
    <section
      id="help"
      aria-labelledby="help-heading"
      tabIndex={-1}
      className="relative scroll-mt-[calc(var(--header-height)+2rem)] overflow-hidden py-16"
    >
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 hidden size-64 rounded-full bg-primary-dark md:block"
      />
      <div
        aria-hidden="true"
        className="absolute -left-8 bottom-0 size-16 rounded-full bg-primary-dark"
      />
      <Container className="relative z-10">
        <SectionHeader
          id="help-heading"
          eyebrow={HELP_CONTENT.eyebrow}
          title={HELP_CONTENT.title}
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:gap-x-14">
          {GUIDES.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      </Container>
    </section>
  );
}
