"use client";

import Image from "next/image";
import { useState } from "react";

type HeroVisualProps = {
  src: string;
  alt: string;
};

export function HeroVisual({ src, alt }: HeroVisualProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="absolute inset-0 -z-10 bg-primary-dark">
      {failed ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-primary-dark/70"
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          preload
          sizes="100vw"
          className="object-cover object-center"
          onError={() => setFailed(true)}
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white/10"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white"
      />
    </div>
  );
}
