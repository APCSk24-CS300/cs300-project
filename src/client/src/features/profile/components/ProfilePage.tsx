"use client";

import type { ReactNode } from "react";
import { ForbiddenView } from "@/components/layout/ForbiddenView";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import { AvatarEditor } from "@/features/profile/components/AvatarEditor";
import { PhoneForm } from "@/features/profile/components/PhoneForm";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPath } from "@/libs/navigation";
import { ROLE_LABEL } from "@/libs/roles";

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <SurfaceCard className="p-6 sm:p-8">
      <section aria-labelledby={id} className="flex flex-col gap-5">
        <div>
          <h2 id={id} className="text-lg font-semibold text-heading">
            {title}
          </h2>
          {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
        </div>
        {children}
      </section>
    </SurfaceCard>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl border border-divider bg-surface-muted/40 px-4 py-3">
      <dt className="text-sm font-medium text-text-muted">{label}</dt>
      <dd className="mt-1 break-words text-base font-semibold text-heading">
        {value || <span className="font-normal text-text-muted">Not provided</span>}
      </dd>
    </div>
  );
}

function ProfileLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <SurfaceCard className="flex items-center gap-5 p-6 sm:p-8">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-48 max-w-full" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
      </SurfaceCard>
      <SurfaceCard className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </SurfaceCard>
    </div>
  );
}

/**
 * UC-03 "My profile" (plan 006 §5), inside the protected AppShell:
 * - picture (authenticated image; upload / remove, A3 / A4 / A8 / A9);
 * - account details, read-only (A6: name, email, role, and for students the ID and faculty);
 * - contact: the phone number, the one editable field (steps 3–4, A1, A5);
 * - password: the shared ChangePasswordForm, variant "profile" (A2 / A7).
 * Every saved change also refreshes the AuthProvider user, so AccountMenu follows (plan 006 O4).
 */
export function ProfilePage() {
  const state = useMyProfile();
  const { user, refresh } = useAuth();

  if (state.status === "forbidden") {
    return <ForbiddenView dashboardHref={getDashboardPath(user?.role)} />;
  }

  const profile = state.profile;
  const academicInfo = profile?.academicInfo ?? null;

  return (
    <>
      <PageHeader title="My profile" description="Your saved contact details, picture and password." />

      <div aria-busy={state.status === "loading"} data-status={state.status} className="flex flex-col gap-6">
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
            onRetry={state.retry}
          />
        ) : null}

        {profile ? (
          <>
            <Section id="profile-picture-heading" title="Profile picture">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <ProfileAvatar avatarUrl={profile.avatarUrl} name={profile.fullName} size="lg" showRetry />
                <div className="min-w-0 flex-1">
                  <AvatarEditor
                    avatarUrl={profile.avatarUrl}
                    onSaved={(avatarUrl) => {
                      state.apply({ avatarUrl });
                      void refresh();
                    }}
                  />
                </div>
              </div>
            </Section>

            <Section
              id="profile-account-heading"
              title="Account details"
              description="Managed by the university. Contact the administrator if something is wrong."
            >
              <span className="w-fit rounded-pill bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-text-muted">
                Read only
              </span>
              <dl className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField label="Full name" value={profile.fullName} />
                <ReadOnlyField label="Email" value={profile.email} />
                {user ? <ReadOnlyField label="Role" value={ROLE_LABEL[user.role]} /> : null}
                {academicInfo ? (
                  <>
                    <ReadOnlyField label="Student number" value={academicInfo.studentNumber} />
                    <ReadOnlyField label="Faculty" value={academicInfo.faculty?.name ?? null} />
                  </>
                ) : null}
              </dl>
              {academicInfo ? null : <p className="text-sm text-text-muted">No academic information available</p>}
            </Section>

            <Section id="profile-contact-heading" title="Contact information">
              <PhoneForm
                phoneNumber={profile.phoneNumber}
                onSaved={(saved) => {
                  state.apply({ phoneNumber: saved.phoneNumber });
                  void refresh();
                }}
              />
            </Section>

            <Section id="profile-password-heading" title="Change password" description="Enter your current password first.">
              <ChangePasswordForm variant="profile" />
            </Section>
          </>
        ) : null}
      </div>
    </>
  );
}
