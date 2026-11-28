import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useUniversityServices } from "@/features/services/hooks/useUniversityServices";
import type { HubService } from "@/features/services/services/hub.service";
import type { UniversityService } from "@/features/services/types/service";

const moodle: UniversityService = {
  id: "1", name: "Moodle", description: null, href: "https://moodle.hcmus.edu.vn/",
  icon: { src: "/images/services/moodle.png", alt: "" }, displayOrder: 1, isActive: true, version: 1,
};

function fake(impl: HubService["listServices"]): HubService {
  return { listServices: vi.fn(impl) };
}

describe("useUniversityServices", () => {
  it("goes from loading to success", async () => {
    const service = fake(async () => [moodle]);
    const { result } = renderHook(() => useUniversityServices(service));
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.services).toEqual([moodle]);
  });

  it("reports empty when there are no services", async () => {
    const { result } = renderHook(() => useUniversityServices(fake(async () => [])));
    await waitFor(() => expect(result.current.status).toBe("empty"));
  });

  it("reports errors and recovers on refetch", async () => {
    let fail = true;
    const service = fake(async () => {
      if (fail) throw new Error("down");
      return [moodle];
    });
    const { result } = renderHook(() => useUniversityServices(service));
    await waitFor(() => expect(result.current.status).toBe("error"));
    fail = false;
    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(service.listServices).toHaveBeenCalledTimes(2);
  });

  it("does not load when disabled", () => {
    const service = fake(async () => [moodle]);
    renderHook(() => useUniversityServices(service, false));
    expect(service.listServices).not.toHaveBeenCalled();
  });

  it("aborts the request on unmount", () => {
    let signal: AbortSignal | undefined;
    const service = fake((s) => {
      signal = s;
      return new Promise(() => {});
    });
    const { unmount } = renderHook(() => useUniversityServices(service));
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
