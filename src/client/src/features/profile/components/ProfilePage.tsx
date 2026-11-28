"use client";

import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { AvatarEditor } from "@/features/profile/components/AvatarEditor";
import { PasswordChangeForm } from "@/features/profile/components/PasswordChangeForm";
import { ForbiddenView } from "@/components/layout/ForbiddenView";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { profileService } from "@/features/profile/services/profile.service";
import { useAuth } from "@/hooks/useAuth";
import { isApiError } from "@/libs/api-client";
import { toUserMessage } from "@/libs/error-messages";
import { getDashboardPath } from "@/libs/navigation";
import { getPhoneNumberError } from "@/features/profile/validation/profile.validation";

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
  const [imageError, setImageError] = useState(false);
  const [imageRetry, setImageRetry] = useState(0);
  // UC-03 step 2 through the shared read core; saved changes also refresh the AuthProvider user, so
  // AccountMenu (name, avatar) follows from the server, with no second store (plan 006 O4).
  const state = useMyProfile();
  const { user, refresh } = useAuth();
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleRetry = state.retry;

  const handleStartEditingPhone = () => {
    if (!profile) {
      return;
    }

    setPhoneDraft(profile.phoneNumber ?? "");
    setPhoneError(null);
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditingPhone(true);
  };

  const handleCancelEditingPhone = () => {
    setIsEditingPhone(false);
    setPhoneDraft("");
    setPhoneError(null);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSavePhone = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) {
      return;
    }

    const validationError = getPhoneNumberError(phoneDraft);
    if (validationError) {
      setPhoneError(validationError);
      setSaveError(null);
      setSaveSuccess(false);
      return;
    }

    setPhoneError(null);
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const updatedProfile = await profileService.updatePhoneNumber(
        phoneDraft === "" ? null : phoneDraft,
      );
      state.apply({ phoneNumber: updatedProfile.phoneNumber });
      void refresh();
      setIsEditingPhone(false);
      setPhoneDraft("");
      setSaveSuccess(true);
    } catch (error) {
      // A field error from the server (400 { field }) goes on the field; everything else is copy from
      // toUserMessage (FR-011). The draft is kept for correction (A5).
      const fieldMessage = isApiError(error) ? error.fieldErrors.phoneNumber : undefined;
      if (fieldMessage && isApiError(error) && error.code === "VALIDATION_FAILED") {
        setPhoneError(fieldMessage);
      } else {
        setSaveError(toUserMessage(error, "profilePhone"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const profile = state.profile;
  const academicInfo = profile?.academicInfo ?? null;

  if (state.status === "forbidden") {
    return <ForbiddenView dashboardHref={getDashboardPath(user?.role)} />;
  }

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
                {profile.avatarUrl && !imageError ? (
                  // The avatar URL is provided by the API and may use a host not configured in next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${profile.avatarUrl}-${imageRetry}`}
                    src={profile.avatarUrl}
                    onError={() => setImageError(true)}
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

              {imageError && <div role="alert">Picture could not be loaded. <button type="button" onClick={() => { setImageError(false); setImageRetry((value) => value + 1); }}>Retry picture</button></div>}
              <AvatarEditor avatarUrl={profile.avatarUrl} onSaved={(avatarUrl) => {
                setImageError(false);
                state.apply({ avatarUrl });
                void refresh();
              }} />

              <section aria-labelledby="contact-heading" className="pt-8">
                <h2 id="contact-heading" className="text-lg font-semibold text-text">
                  Contact information
                </h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  {isEditingPhone ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <label
                        htmlFor="profile-phone-number"
                        className="text-sm font-medium text-text-muted"
                      >
                        Phone number
                      </label>
                      <form className="mt-2" onSubmit={handleSavePhone} noValidate>
                        <input
                          id="profile-phone-number"
                          name="phoneNumber"
                          type="tel"
                          autoComplete="tel"
                          inputMode="tel"
                          value={phoneDraft}
                          onChange={(event) => {
                            setPhoneDraft(event.target.value);
                            setPhoneError(null);
                            setSaveError(null);
                          }}
                          aria-invalid={phoneError !== null || saveError !== null}
                          aria-describedby={
                            phoneError ? "profile-phone-error" : saveError ? "profile-save-error" : undefined
                          }
                          className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                          disabled={isSaving}
                        />
                        {phoneError ? (
                          <p
                            id="profile-phone-error"
                            className="mt-2 text-sm text-red-700"
                            role="alert"
                          >
                            {phoneError}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm text-text-muted">
                          Use 0 followed by 9 digits, or +84 followed by 9 digits.
                          Leave blank to remove your phone number.
                        </p>
                        {saveError ? (
                          <p id="profile-save-error" className="mt-2 text-sm text-red-700" role="alert">
                            {saveError}
                          </p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex min-h-11 items-center justify-center rounded-pill bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSaving ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleCancelEditingPhone}
                            className="inline-flex min-h-11 items-center justify-center rounded-pill border border-slate-300 px-5 text-sm font-semibold text-text hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div>
                      <ProfileField label="Phone number" value={profile.phoneNumber} />
                      <button
                        type="button"
                        onClick={handleStartEditingPhone}
                        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-pill border border-primary px-5 text-sm font-semibold text-primary hover:bg-primary/5"
                      >
                        Edit phone number
                      </button>
                    </div>
                  )}
                  <ProfileField label="Email address" value={profile.email} />
                </dl>
                {saveSuccess ? (
                  <p className="mt-4 text-sm font-medium text-green-700" role="status">
                    Phone number updated successfully.
                  </p>
                ) : null}
              </section>

              <PasswordChangeForm />

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
