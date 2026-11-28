"use client";

import { useEffect, useMemo, useState } from "react";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { api } from "@/libs/api-client";
import { cn } from "@/libs/cn";

/** `…/profile/avatar/files/{name}` (the BE's same-origin URL) → `{name}`; anything else → null (DOC-21). */
export function avatarFileName(avatarUrl: string | null | undefined): string | null {
  const match = avatarUrl?.match(/\/profile\/avatar\/files\/([A-Za-z0-9._-]+)$/);
  return match ? match[1]! : null;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : "";
  return (first + last).toUpperCase();
}

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-20 text-2xl",
} as const;

type ProfileAvatarProps = {
  avatarUrl: string | null | undefined;
  /** Full name: used for the alt text and the initials fallback. */
  name: string;
  size?: keyof typeof SIZES;
  /** Show "Retry picture" when the file read fails (profile page; UC-03 A9). */
  showRetry?: boolean;
  className?: string;
};

/**
 * The user's picture, loaded through the single API client (`api.blob`, with the bearer): an `<img src>`
 * cannot carry the bearer (plan 006 O8, Q5). Falls back to initials while loading, without a picture,
 * and when the file cannot be read.
 */
export function ProfileAvatar({ avatarUrl, name, size = "md", showRetry = false, className }: ProfileAvatarProps) {
  const fileName = avatarFileName(avatarUrl);
  const resource = useAsyncResource(
    () => api.blob(`/profile/avatar/files/${encodeURIComponent(fileName ?? "")}`),
    ["avatar", fileName],
    fileName !== null,
  );
  const blob = fileName !== null && resource.status === "success" ? resource.data : null;
  const objectUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const [failedLoad, setFailedLoad] = useState<string | null>(null);
  // `failedLoad` is the object URL whose <img> fired onError; null (nothing failed) must not match a
  // null objectUrl while the file is still loading.
  const failed =
    fileName !== null &&
    (resource.status === "error" || resource.status === "forbidden" || (failedLoad !== null && failedLoad === objectUrl));
  const box = cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full", SIZES[size], className);

  if (objectUrl && !failed) {
    return (
      // A same-origin object URL for bytes the API client already fetched; next/image cannot load it.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={objectUrl}
        alt={`${name}'s profile picture`}
        onError={() => setFailedLoad(objectUrl)}
        className={cn(box, "border border-divider object-cover")}
      />
    );
  }

  return (
    <span className="inline-flex flex-col items-center gap-2">
      <span
        role="img"
        aria-label="No profile picture"
        aria-busy={fileName !== null && resource.status === "loading" ? true : undefined}
        className={cn(box, "bg-primary/10 font-bold text-primary")}
      >
        {initialsOf(name)}
      </span>
      {failed && showRetry ? (
        <span role="alert" className="flex flex-col items-center gap-1 text-center text-sm text-text-muted">
          Picture could not be loaded.
          <button
            type="button"
            onClick={() => {
              setFailedLoad(null);
              resource.retry();
            }}
            className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            Retry picture
          </button>
        </span>
      ) : null}
    </span>
  );
}
