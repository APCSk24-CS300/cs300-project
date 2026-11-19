import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useLandingActivities } from "@/features/activities/hooks/useLandingActivities";
import { InvalidLandingActivitiesError } from "@/features/activities/mappers/activity.mapper";
import { MockActivityService } from "@/features/activities/services/mock.activity.service";
import type { ActivityService } from "@/features/activities/services/activity.service";
import type { LandingActivities } from "@/features/activities/types";
import { createLandingActivities } from "../../../../tests/fixtures";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function createDeferredService() {
  const calls: Array<{
    signal: AbortSignal | undefined;
    request: Deferred<LandingActivities>;
  }> = [];

  const service: ActivityService = {
    getLandingActivities: vi.fn((signal?: AbortSignal) => {
      const request = createDeferred<LandingActivities>();
      calls.push({ signal, request });
      return request.promise;
    }),
  };

  return { calls, service };
}

describe("useLandingActivities", () => {
  it("starts loading and resolves to success", async () => {
    const { calls, service } = createDeferredService();
    const data = createLandingActivities();

    const { result } = renderHook(() => useLandingActivities(service));

    expect(result.current.status).toBe("loading");
    expect(calls).toHaveLength(1);

    await act(async () => {
      calls[0].request.resolve(data);
      await Promise.resolve();
    });

    expect(result.current.status).toBe("success");

    if (result.current.status === "success") {
      expect(result.current.data).toBe(data);
      expect(result.current.error).toBeNull();
    }
  });

  it("resolves to empty for a collection without activities", async () => {
    const { calls, service } = createDeferredService();
    const data = createLandingActivities({ featured: [], upcoming: [] });

    const { result } = renderHook(() => useLandingActivities(service));

    await act(async () => {
      calls[0].request.resolve(data);
      await Promise.resolve();
    });

    expect(result.current.status).toBe("empty");

    if (result.current.status === "empty") {
      expect(result.current.data).toBe(data);
    }
  });

  it("resolves to error", async () => {
    const { calls, service } = createDeferredService();
    const error = new Error("boom");

    const { result } = renderHook(() => useLandingActivities(service));

    await act(async () => {
      calls[0].request.reject(error);
      await Promise.resolve();
    });

    expect(result.current.status).toBe("error");

    if (result.current.status === "error") {
      expect(result.current.error).toBe(error);
    }
  });

  it("retries into loading and then success", async () => {
    const { calls, service } = createDeferredService();
    const data = createLandingActivities();

    const { result } = renderHook(() => useLandingActivities(service));

    await act(async () => {
      calls[0].request.reject(new Error("first failure"));
      await Promise.resolve();
    });
    expect(result.current.status).toBe("error");

    act(() => {
      result.current.refetch();
    });

    expect(result.current.status).toBe("loading");
    expect(calls).toHaveLength(2);

    await act(async () => {
      calls[1].request.resolve(data);
      await Promise.resolve();
    });

    expect(result.current.status).toBe("success");
  });

  it("aborts the in-flight request on unmount", () => {
    const { calls, service } = createDeferredService();
    const { unmount } = renderHook(() => useLandingActivities(service));

    expect(calls[0].signal?.aborted).toBe(false);

    unmount();

    expect(calls[0].signal?.aborted).toBe(true);
  });

  it("ignores a stale response after retry", async () => {
    const { calls, service } = createDeferredService();
    const staleData = createLandingActivities({
      featured: [createLandingActivities().featured[0]],
    });
    const freshData = createLandingActivities({
      featured: [createLandingActivities().featured[0]],
    });

    const { result } = renderHook(() => useLandingActivities(service));

    act(() => {
      result.current.refetch();
    });

    expect(calls).toHaveLength(2);
    expect(calls[0].signal?.aborted).toBe(true);

    await act(async () => {
      calls[0].request.resolve(staleData);
      calls[1].request.resolve(freshData);
      await Promise.resolve();
    });

    expect(result.current.status).toBe("success");

    if (result.current.status === "success") {
      expect(result.current.data).toBe(freshData);
    }
  });

  it("settles on the latest of repeated retries", async () => {
    const { calls, service } = createDeferredService();
    const staleData = createLandingActivities({
      featured: [createLandingActivities().featured[0]],
    });
    const freshData = createLandingActivities({
      featured: [createLandingActivities().featured[0]],
    });

    const { result } = renderHook(() => useLandingActivities(service));

    act(() => {
      result.current.refetch();
      result.current.refetch();
    });

    expect(calls).toHaveLength(3);
    expect(calls[1].signal?.aborted).toBe(true);

    await act(async () => {
      calls[1].request.resolve(staleData);
      calls[2].request.resolve(freshData);
      await Promise.resolve();
    });

    expect(result.current.status).toBe("success");

    if (result.current.status === "success") {
      expect(result.current.data).toBe(freshData);
    }
  });

  it("turns a mapper error into error state", async () => {
    const { result } = renderHook(() =>
      useLandingActivities(new MockActivityService("all-invalid", 0)),
    );

    await waitFor(() => expect(result.current.status).toBe("error"));

    if (result.current.status === "error") {
      expect(result.current.error).toBeInstanceOf(
        InvalidLandingActivitiesError,
      );
      expect(
        (result.current.error as InvalidLandingActivitiesError).code,
      ).toBe("NO_USABLE_ITEMS");
    }
  });
});
