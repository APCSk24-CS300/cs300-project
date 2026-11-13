"use client";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ServiceCard } from "@/features/landing/components/ServiceCard";
import {
  SERVICES,
  SERVICES_CONTENT,
} from "@/features/landing/config/services";
import { getLoginHref } from "@/libs/navigation";

export function ServicesSection() {
  return (
    <Section
      id="services"
      labelledBy="services-heading"
      background="primary-dark"
    >
      <Container>
        <SectionHeader
          id="services-heading"
          eyebrow={SERVICES_CONTENT.eyebrow}
          title={SERVICES_CONTENT.title}
          tone="dark"
        />
        <div className="relative mt-10">
          <div
            aria-hidden="true"
            inert
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SERVICES.map((service) => (
              <ServiceCard key={service.id} service={service} locked />
            ))}
          </div>
          <div
            aria-hidden="true"
            data-testid="services-lock-overlay"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/40 to-transparent backdrop-blur-[2px]"
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-5">
            <Button href={getLoginHref("/#services")} variant="white">
              {SERVICES_CONTENT.loginMoreLabel}
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
