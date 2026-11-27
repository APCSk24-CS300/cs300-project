"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import type { Profile } from "@/features/profile/types";
import { profileService } from "@/features/profile/services/profile.service";

type LoadState =
  | { status: "loading" }
  | { status: "success"; profile: Profile }
  | { status: "error" };

function ProfileLoading() {
  return (
    <div role="status" aria-label="Loading profile">
      <SurfaceCard className="mt-8 grid gap-8 p-6 sm:p-8">
        <div className="flex items-center gap-5">
          <Skeleton className="size-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48 max-w-full" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </SurfaceCard>
    </div>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <dt className="text-sm font-medium text-text-muted">{label}</dt>
      <dd className="mt-1 break-words text-base font-semibold text-text">
        {value || <span className="font-normal text-text-muted">Not provided</span>}
      </dd>
    </div>
  );
}

export function ProfilePage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [requestNumber, setRequestNumber] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    profileService
      .getProfile(controller.signal)
      .then((profile) => {
        if (active) {
          setState({ status: "success", profile });
        }
      })
      .catch((error: unknown) => {
        if (active && !(error instanceof Error && error.name === "AbortError")) {
          setState({ status: "error" });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [requestNumber]);

  const handleRetry = () => {
    setState({ status: "loading" });
    setRequestNumber((current) => current + 1);
  };
  const profile = state.status === "success" ? state.profile : null;
  const academicInfo = profile?.academicInfo ?? null;

  return (
    <main className="min-h-screen bg-slate-50 py-12 sm:py-16">
      <Container>
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-text sm:text-4xl">
            My Profile
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">
            View your saved contact information and academic identity.
          </p>
        </header>

        <div
          className="mt-8"
          aria-busy={state.status === "loading"}
          data-status={state.status}
        >
          <p className="sr-only" role="status" aria-live="polite">
            {state.status === "loading"
              ? "Loading your profile"
              : state.status === "error"
                ? "Your profile could not be loaded"
                : "Your profile is loaded"}
          </p>

          {state.status === "loading" ? <ProfileLoading /> : null}

          {state.status === "error" ? (
            <ErrorState
              title="Profile could not be loaded"
              description="Your saved profile information is unavailable right now. Please try again."
              retryLabel="Retry"
              onRetry={handleRetry}
            />
          ) : null}

          {profile ? (
            <SurfaceCard className="mt-8 p-6 sm:p-8">
              <section
                aria-labelledby="profile-identity-heading"
                className="flex flex-col gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-center"
              >
                {profile.avatarUrl ? (
                  // The avatar URL is provided by the API and may use a host not configured in next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt={`${profile.fullName}'s profile picture`}
                    className="size-20 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div
                    aria-label="No profile picture"
                    role="img"
                    className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary"
                  >
                    {profile.fullName.trim().charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <h2
                    id="profile-identity-heading"
                    className="text-2xl font-bold text-text"
                  >
                    {profile.fullName}
                  </h2>
                  <p className="mt-1 text-text-muted">{profile.email}</p>
                </div>
              </section>

              <section aria-labelledby="contact-heading" className="pt-8">
                <h2 id="contact-heading" className="text-lg font-semibold text-text">
                  Contact information
                </h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <ProfileField label="Phone number" value={profile.phoneNumber} />
                  <ProfileField label="Email address" value={profile.email} />
                </dl>
              </section>

              <section
                aria-labelledby="academic-heading"
                className="mt-8 border-t border-slate-200 pt-8"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h2 id="academic-heading" className="text-lg font-semibold text-text">
                    Academic identity
                  </h2>
                  <span className="rounded-pill bg-slate-100 px-3 py-1 text-xs font-semibold text-text-muted">
                    Read only
                  </span>
                </div>
                {academicInfo ? (
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <ProfileField
                      label="Student number"
                      value={academicInfo.studentNumber}
                    />
                    <ProfileField
                      label="Faculty"
                      value={academicInfo.faculty?.name ?? null}
                    />
                  </dl>
                ) : (
                  <EmptyState
                    title="No academic information available"
                    description="Academic identity details are not available for this account."
                    className="mt-4 min-h-0 py-8"
                  />
                )}
              </section>
            </SurfaceCard>
          ) : null}
        </div>
      </Container>
    </main>
  );
}
