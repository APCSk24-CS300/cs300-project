import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useHubServices } from "@/features/services/hooks/useHubServices";
import type { HubService } from "@/features/services/services/hub.service";
import type { UniversityService } from "@/features/services/types/service";
import { updateDb } from "@/mocks/db/store";
import { signInAs } from "../../../../tests/test-utils";

const moodle: UniversityService = {
  id: "1", name: "Moodle", description: null, href: "https://moodle.hcmus.edu.vn/",
  icon: { src: "/images/services/moodle.png", alt: "" }, displayOrder: 1, isActive: true, version: 1,
};

function fake(impl: HubService["listServices"]): HubService {
  return { listServices: vi.fn(impl) };
}

describe("useHubServices (useAsyncResource)", () => {
  it("goes from loading to success", async () => {
    const service = fake(async () => [moodle]);
    const { result } = renderHook(() => useHubServices(service));
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.services).toEqual([moodle]);
  });

  it("reports empty when there are no services", async () => {
    const { result } = renderHook(() => useHubServices(fake(async () => [])));
    await waitFor(() => expect(result.current.status).toBe("empty"));
  });

  it("reports errors and recovers on refetch", async () => {
    let fail = true;
    const service = fake(async () => {
      if (fail) throw new Error("down");
      return [moodle];
    });
    const { result } = renderHook(() => useHubServices(service));
    await waitFor(() => expect(result.current.status).toBe("error"));
    fail = false;
    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(service.listServices).toHaveBeenCalledTimes(2);
  });

  it("does not load when disabled", () => {
    const service = fake(async () => [moodle]);
    renderHook(() => useHubServices(service, false));
    expect(service.listServices).not.toHaveBeenCalled();
  });

  // The signal is not passed to fetch (not portable across realms); the hook ignores late answers instead.
  it("ignores the answer after unmount", async () => {
    let resolve: (value: UniversityService[]) => void = () => undefined;
    const service = fake(() => new Promise((r) => (resolve = r)));
    const { result, unmount } = renderHook(() => useHubServices(service));
    unmount();
    await act(async () => resolve([moodle]));
    expect(result.current.status).toBe("loading");
  });
});

describe("useHubServices against the MSW hub handlers", () => {
  it("reports forbidden when the account may not read the hub", async () => {
    updateDb((db) => {
      db.rolePermissions["role-student"] = db.rolePermissions["role-student"].filter((c) => c !== "hub.services.read");
    });
    signInAs("student1@example.invalid");
    const { result } = renderHook(() => useHubServices());
    await waitFor(() => expect(result.current.status).toBe("forbidden"));
    expect(result.current.services).toBeNull();
  });

  it("loads the seeded active services through the API client", async () => {
    signInAs("manager1@example.invalid");
    const { result } = renderHook(() => useHubServices());
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.services?.map((s) => s.name)).toEqual([
      "Moodle", "Student Portal", "Course Registration Portal", "Special Programs Portal", "Tuition Payment", "Student Handbook 2025",
    ]);
  });
});
