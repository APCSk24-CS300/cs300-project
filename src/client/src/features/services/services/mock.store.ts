import { SERVICE_FIXTURES } from "@/features/services/services/service.fixtures";
import type { UniversityServiceDTO } from "@/features/services/types/service.dto";

/**
 * In-memory service links shared by the mock hub service and the mock admin service, so an admin change
 * in mock mode shows on the hub page in the same browser session. Resets on page reload.
 */
class MockServiceLinkStore {
  links: UniversityServiceDTO[] = SERVICE_FIXTURES.map((l) => ({ ...l }));
  private nextId = SERVICE_FIXTURES.length + 1;

  newId(): string {
    return String(this.nextId++);
  }

  reset(): void {
    this.links = SERVICE_FIXTURES.map((l) => ({ ...l }));
    this.nextId = SERVICE_FIXTURES.length + 1;
  }
}

export const mockServiceLinkStore = new MockServiceLinkStore();

export function mockDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}
