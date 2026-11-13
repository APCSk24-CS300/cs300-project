import Image from "next/image";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";
import {
  SERVICES_CONTENT,
  type ServiceEntry,
} from "@/features/landing/config/services";
import { cn } from "@/libs/cn";

type ServiceCardProps = {
  service: ServiceEntry;
  locked: boolean;
};

export function ServiceCard({ service, locked }: ServiceCardProps) {
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
        <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
          {service.available
            ? SERVICES_CONTENT.accessLabel
            : SERVICES_CONTENT.unavailableLabel}
          {service.available ? (
            <ArrowRightIcon aria-hidden="true" className="size-3.5" />
          ) : null}
        </span>
      </span>
    </>
  );

  const baseClasses =
    "flex min-h-[76px] w-full items-center gap-4 rounded-2xl bg-surface px-4 py-3 shadow-card";

  if (locked) {
    return (
      <div
        aria-hidden="true"
        inert
        className={cn(
          baseClasses,
          "pointer-events-none select-none opacity-75 blur-[3px]",
        )}
      >
        {content}
      </div>
    );
  }

  if (!service.available) {
    return (
      <div className={cn(baseClasses, "opacity-75")}>
        {content}
      </div>
    );
  }

  return (
    <a
      href={service.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${service.name} (${SERVICES_CONTENT.externalLinkLabel})`}
      className={cn(
        baseClasses,
        "transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transform-none motion-reduce:transition-none",
      )}
    >
      {content}
    </a>
  );
}
