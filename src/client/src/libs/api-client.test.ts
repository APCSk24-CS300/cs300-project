import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api-client";

describe("api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards an abort signal to fetch and returns parsed JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    const result = await api.get<{ data: { ok: boolean } }>(
      "/activities/landing",
      { signal: controller.signal },
    );

    expect(result).toEqual({ data: { ok: true } });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/activities/landing"),
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("normalizes non-ok responses into an Error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("server exploded", {
          status: 500,
          statusText: "Internal Server Error",
        }),
      ),
    );

    await expect(api.get("/activities/landing")).rejects.toThrow(
      "API request failed: 500 Internal Server Error - server exploded",
    );
  });
});
