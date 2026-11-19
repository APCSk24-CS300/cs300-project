"use client";

import { useRef } from "react";
import { CalendarIcon } from "@/components/icons/CalendarIcon";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ActivitiesSkeleton } from "@/features/activities/components/ActivitiesSkeleton";
import { ActivityGrid } from "@/features/activities/components/ActivityGrid";
import { ACTIVITIES_SECTION } from "@/features/activities/config";
import { useLandingActivities } from "@/features/activities/hooks/useLandingActivities";

export function ActivitiesSection() {
  const { status, data, refetch } = useLandingActivities();
  const headingRef = useRef<HTMLDivElement>(null);

  const announcement =
    status === "loading"
      ? ACTIVITIES_SECTION.loadingAnnouncement
      : status === "empty"
        ? ACTIVITIES_SECTION.emptyAnnouncement
        : status === "error"
          ? ACTIVITIES_SECTION.errorAnnouncement
          : ACTIVITIES_SECTION.successAnnouncement;

  const handleRetry = () => {
    headingRef.current?.focus();
    refetch();
  };

  return (
    <Section id="activities" labelledBy="activities-heading">
      <Container>
        <div ref={headingRef} tabIndex={-1}>
          <SectionHeader
            id="activities-heading"
            eyebrow={ACTIVITIES_SECTION.eyebrow}
            title={ACTIVITIES_SECTION.title}
            align="center"
          />
        </div>

        <div
          className="mt-10"
          aria-busy={status === "loading"}
          data-status={status}
        >
          <p className="sr-only" role="status" aria-live="polite">
            {announcement}
          </p>

          {status === "loading" ? <ActivitiesSkeleton /> : null}

          {status === "success" && data ? (
            <ActivityGrid activities={data} />
          ) : null}

          {status === "empty" ? (
            <EmptyState
              icon={<CalendarIcon className="size-10" />}
              title={ACTIVITIES_SECTION.empty.title}
              description={ACTIVITIES_SECTION.empty.description}
            />
          ) : null}

          {status === "error" ? (
            <ErrorState
              title={ACTIVITIES_SECTION.error.title}
              description={ACTIVITIES_SECTION.error.description}
              retryLabel={ACTIVITIES_SECTION.error.retryLabel}
              onRetry={handleRetry}
            />
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
