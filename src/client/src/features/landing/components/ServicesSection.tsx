"use client";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ServiceCard } from "@/features/landing/components/ServiceCard";
import {
  SERVICES,
  SERVICES_CONTENT,
} from "@/features/landing/config/services";
import { useAuth } from "@/hooks/useAuth";

export function ServicesSection() {
  const { isAuthenticated, isLoading } = useAuth();
  const authLocked = isLoading || !isAuthenticated;

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
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              locked={authLocked && service.access === "authenticated"}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
