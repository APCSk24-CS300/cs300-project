"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { profileService } from "@/features/profile/services/profile.service";
import { getAvatarError } from "@/features/profile/validation/avatar.validation";
import { toUserMessage } from "@/libs/error-messages";

type AvatarEditorProps = {
  avatarUrl: string | null;
  /** Called with the saved URL (upload) or null (removal), only after the server confirmed it. */
  onSaved: (url: string | null) => void;
};

/**
 * UC-03 A3 / A4 / A8 / A9: choose a JPG or PNG up to 10 MB, preview it, save it; remove after
 * confirmation. The client check is feedback only; the server checks the content. On any failure the
 * saved picture is kept and the chosen file stays selected for a retry.
 */
export function AvatarEditor({ avatarUrl, onSaved }: AvatarEditorProps) {
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function clearSelection() {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function upload() {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      onSaved(await profileService.uploadAvatar(file));
      clearSelection();
      setMessage("Profile picture updated.");
    } catch (failure) {
      setError(toUserMessage(failure, "avatarUpload"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    setConfirmRemove(false);
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await profileService.removeAvatar();
      onSaved(null);
      clearSelection();
      setMessage("Profile picture removed.");
    } catch (failure) {
      setError(toUserMessage(failure, "avatarRemove"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Manage profile picture" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-[15px] font-semibold text-heading">
          Choose profile picture
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png"
          aria-describedby={hintId}
          disabled={busy}
          className="text-sm text-text file:mr-3 file:rounded-pill file:border-0 file:bg-surface-muted file:px-4 file:py-2 file:font-semibold file:text-heading hover:file:bg-divider"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            setMessage(null);
            setError(null);
            if (!selected) {
              clearSelection();
              return;
            }
            const validationError = getAvatarError(selected);
            if (validationError) {
              setError(validationError);
              clearSelection();
              return;
            }
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
          }}
        />
        <p id={hintId} className="text-sm text-text-muted">
          JPG or PNG, up to 10 MB.
        </p>
      </div>

      {preview ? (
        <div className="flex flex-wrap items-center gap-4">
          {/* A local preview of the chosen file (an object URL); next/image cannot load it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="New profile picture preview" className="size-20 rounded-full border border-divider object-cover" />
          <Button size="sm" onClick={upload} isLoading={busy} disabled={busy}>
            {busy ? "Saving…" : "Save picture"}
          </Button>
        </div>
      ) : null}

      {avatarUrl ? (
        <div>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => setConfirmRemove(true)}>
            Remove picture
          </Button>
        </div>
      ) : null}

      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}

      <ConfirmDialog
        open={confirmRemove}
        title="Remove your profile picture?"
        confirmLabel="Confirm removal"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => void remove()}
      >
        The default picture (your initials) is shown instead. You can choose a new picture at any time.
      </ConfirmDialog>
    </section>
  );
}
