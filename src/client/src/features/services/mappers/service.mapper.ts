import { serviceIconFor } from "@/features/services/config/icons";
import type { UniversityService } from "@/features/services/types/service";
import type { UniversityServiceDTO } from "@/features/services/types/service.dto";

/** True for absolute http(s) URLs only, so a bad record can never render a `javascript:` link. */
export function isSafeHref(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function mapServiceDTO(dto: UniversityServiceDTO): UniversityService | null {
  if (!dto || typeof dto.name !== "string" || dto.name.trim() === "" || !isSafeHref(dto.url)) {
    return null;
  }
  return {
    id: String(dto.id),
    name: dto.name,
    description: dto.description ?? null,
    href: dto.url,
    icon: { src: serviceIconFor(dto.name), alt: "" },
    displayOrder: Number.isFinite(dto.displayOrder) ? dto.displayOrder : 0,
    isActive: dto.isActive !== false,
    version: Number.isFinite(dto.version) ? dto.version : 1,
  };
}

/** Hub order: display order, then name (case-insensitive), then id. */
export function compareServices(a: UniversityService, b: UniversityService): number {
  return (
    a.displayOrder - b.displayOrder ||
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()) ||
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );
}

/** Maps a list, dropping unsafe or malformed items, and sorts it in hub order. */
export function mapServiceListDTO(data: unknown): UniversityService[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => mapServiceDTO(item as UniversityServiceDTO))
    .filter((s): s is UniversityService => s !== null)
    .sort(compareServices);
}
