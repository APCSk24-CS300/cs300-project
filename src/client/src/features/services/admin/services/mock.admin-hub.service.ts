import { mapServiceDTO, mapServiceListDTO } from "@/features/services/mappers/service.mapper";
import { mockDelay, mockServiceLinkStore } from "@/features/services/services/mock.store";
import type { AdminHubService } from "@/features/services/admin/services/admin-hub.service";
import type { CreateServiceLinkDTO, UniversityServiceDTO, UpdateServiceLinkDTO } from "@/features/services/types/service.dto";
import { ApiError } from "@/libs/api-client";

function duplicate(): ApiError {
  return new ApiError({
    status: 409,
    code: "DUPLICATE_VALUE",
    message: "A service with this name already exists",
    fieldErrors: { name: "A service with this name already exists" },
  });
}

/** Mock-mode admin service with the backend's rules: unique names, versions, deactivate never deletes. */
export class MockAdminHubService implements AdminHubService {
  private readonly delayMs: number;

  constructor(delayMs = 200) {
    this.delayMs = delayMs;
  }

  private nameTaken(name: string, exceptId?: string) {
    const key = name.trim().toLowerCase();
    return mockServiceLinkStore.links.some((l) => l.id !== exceptId && l.name.trim().toLowerCase() === key);
  }

  private save(id: string, version: number, change: Partial<UniversityServiceDTO>) {
    const index = mockServiceLinkStore.links.findIndex((l) => l.id === id);
    if (index < 0) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "This university service does not exist" });
    const current = mockServiceLinkStore.links[index]!;
    if (current.version !== version) {
      throw new ApiError({ status: 412, code: "PRECONDITION_FAILED", message: "The link was changed by someone else" });
    }
    if (change.name !== undefined && this.nameTaken(change.name, id)) throw duplicate();
    const next = { ...current, ...change };
    const changed = (Object.keys(change) as (keyof UniversityServiceDTO)[]).some((k) => next[k] !== current[k]);
    const saved = changed ? { ...next, version: current.version + 1 } : current;
    mockServiceLinkStore.links[index] = saved;
    return mapServiceDTO(saved)!;
  }

  async listAll(signal?: AbortSignal) {
    await mockDelay(this.delayMs, signal);
    return mapServiceListDTO(mockServiceLinkStore.links);
  }

  async create(body: CreateServiceLinkDTO) {
    await mockDelay(this.delayMs);
    if (this.nameTaken(body.name)) throw duplicate();
    const maxOrder = mockServiceLinkStore.links.reduce((m, l) => Math.max(m, l.displayOrder), -1);
    const link: UniversityServiceDTO = {
      id: mockServiceLinkStore.newId(),
      name: body.name.trim(),
      url: body.url.trim(),
      description: body.description ?? null,
      displayOrder: body.displayOrder ?? Math.min(maxOrder + 1, 9999),
      isActive: body.isActive ?? true,
      version: 1,
    };
    mockServiceLinkStore.links.push(link);
    return mapServiceDTO(link)!;
  }

  async update(id: string, body: UpdateServiceLinkDTO, version: number) {
    await mockDelay(this.delayMs);
    const change: Partial<UniversityServiceDTO> = { ...body };
    delete (change as UpdateServiceLinkDTO).reason;
    return this.save(id, version, change);
  }

  async deactivate(id: string, version: number) {
    await mockDelay(this.delayMs);
    return this.save(id, version, { isActive: false });
  }
}
