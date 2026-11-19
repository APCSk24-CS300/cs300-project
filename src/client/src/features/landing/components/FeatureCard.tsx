import Image from "next/image";
import type { Highlight } from "@/features/landing/config/highlights";

type FeatureCardProps = {
  highlight: Highlight;
};

export function FeatureCard({ highlight }: FeatureCardProps) {
  return (
    <article>
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-guide-gradient-to">
        <Image
          src={highlight.image.src}
          alt={highlight.image.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
      <h3 className="mt-4 text-base font-semibold text-text">
        {highlight.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-text-muted">
        {highlight.description}
      </p>
    </article>
  );
}
