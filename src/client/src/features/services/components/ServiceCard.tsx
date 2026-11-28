import Image from "next/image";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";
import { HUB_CONTENT } from "@/features/services/config/content";
import { cn } from "@/libs/cn";

/** What a card needs. A card without `href` is a picture only (guest preview). */
export type ServiceCardData = {
  id: string;
  name: string;
  description?: string | null;
  href?: string;
  icon: { src: string; alt: string };
};

type ServiceCardProps = {
  service: ServiceCardData;
  /** Locked cards are hidden from assistive tech and cannot be focused or clicked. */
  locked?: boolean;
  /** Show the description line (hub page) or keep the compact landing look. */
  showDescription?: boolean;
};

/** One university service. Unlocked cards with an href open the service in a new tab. */
export function ServiceCard({ service, locked = false, showDescription = false }: ServiceCardProps) {
  const content = (
    <>
      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-guide-gradient-to">
        <Image
          src={service.icon.src}
          alt={service.icon.alt}
          width={48}
          height={48}
          className="size-12 object-cover"
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base font-semibold text-text">
          {service.name}
        </span>
        {showDescription && service.description ? (
          <span className="mt-0.5 line-clamp-2 block text-sm text-text-muted">
            {service.description}
          </span>
        ) : null}
        <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
          {HUB_CONTENT.accessLabel}
          <ArrowRightIcon aria-hidden="true" className="size-3.5" />
        </span>
      </span>
    </>
  );

  const baseClasses =
    "flex min-h-[76px] w-full items-center gap-4 rounded-2xl bg-surface px-4 py-3 shadow-card";

  if (locked || !service.href) {
    return (
      <div
        aria-hidden="true"
        inert
        className={cn(baseClasses, "pointer-events-none select-none opacity-75")}
      >
        {content}
      </div>
    );
  }

  return (
    <a
      href={service.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${service.name} (${HUB_CONTENT.externalLinkLabel})`}
      className={cn(
        baseClasses,
        "transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transform-none motion-reduce:transition-none",
      )}
    >
      {content}
    </a>
  );
}
