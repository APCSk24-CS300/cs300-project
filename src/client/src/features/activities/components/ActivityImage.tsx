"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/libs/cn";

const PLACEHOLDER = "/images/landing/activity-placeholder.png";

type ActivityImageProps = {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
};

export function ActivityImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: ActivityImageProps) {
  const [failed, setFailed] = useState(false);
  const imageSrc = !src || failed ? PLACEHOLDER : src;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-primary/10",
        className,
      )}
    >
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        onError={() => {
          if (!failed) {
            setFailed(true);
          }
        }}
      />
    </div>
  );
}
