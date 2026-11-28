"use client";

import { useContext } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AuthContext } from "@/features/auth/context/AuthContext";
import {
  LANDING_SERVICE_LIMIT,
  SERVICES,
  SERVICES_CONTENT,
} from "@/features/landing/config/services";
import { ServiceCard } from "@/features/services/components/ServiceCard";
import { ServiceGrid } from "@/features/services/components/ServiceGrid";
import { ServiceGridSkeleton } from "@/features/services/components/ServiceGridSkeleton";
import { useUniversityServices } from "@/features/services/hooks/useUniversityServices";
import type { HubService } from "@/features/services/services/hub.service";
import { getLoginHref } from "@/libs/navigation";

type ServicesSectionProps = {
  /** Tests pass a fake; otherwise the mock or real hub service is used. */
  service?: HubService;
};

/**
 * Landing "HCMUS services" section. Guests see a locked preview with "Log in for more"; signed-in users
 * see up to six live links from the University Services Hub and a link to the full hub page.
 */
export function ServicesSection({ service }: ServicesSectionProps) {
  const auth = useContext(AuthContext);
  const signedIn = Boolean(auth?.user);
  const state = useUniversityServices(service, signedIn);

  return (
    <Section id="services" labelledBy="services-heading" background="primary-dark">
      <Container>
        <SectionHeader
          id="services-heading"
          eyebrow={SERVICES_CONTENT.eyebrow}
          title={SERVICES_CONTENT.title}
          tone="dark"
        />
        {signedIn ? (
          <div className="mt-10">
            {state.status === "loading" ? <ServiceGridSkeleton count={LANDING_SERVICE_LIMIT} /> : null}
            {state.status === "success" ? (
              <ServiceGrid services={state.services.slice(0, LANDING_SERVICE_LIMIT)} />
            ) : null}
            {state.status === "empty" ? (
              <p className="text-white/80">{SERVICES_CONTENT.emptyLabel}</p>
            ) : null}
            {state.status === "error" ? (
              <div role="alert" className="flex flex-wrap items-center gap-4 text-white">
                <p>{SERVICES_CONTENT.errorLabel}</p>
                <Button variant="white" size="sm" onClick={state.refetch}>
                  {SERVICES_CONTENT.retryLabel}
                </Button>
              </div>
            ) : null}
            <div className="mt-8 flex justify-center">
              <Button href="/services" variant="white">
                {SERVICES_CONTENT.seeAllLabel}
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative mt-10">
            <div aria-hidden="true" inert className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((preview) => (
                <ServiceCard key={preview.id} service={preview} locked />
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
        )}
      </Container>
    </Section>
  );
}
