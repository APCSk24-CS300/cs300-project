import { ServiceCard } from "@/features/services/components/ServiceCard";
import type { UniversityService } from "@/features/services/types/service";

type ServiceGridProps = {
  services: UniversityService[];
  showDescription?: boolean;
};

/** Responsive grid of clickable service cards (1 column on phones, up to 3 on desktop). */
export function ServiceGrid({ services, showDescription = false }: ServiceGridProps) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="University services">
      {services.map((service) => (
        <li key={service.id}>
          <ServiceCard service={service} showDescription={showDescription} />
        </li>
      ))}
    </ul>
  );
}
