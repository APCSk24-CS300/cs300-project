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

  it.each([
    ["/api/v1/profile", { phoneNumber: "0912345678" }],
    ["/api/v1/profile/password", { currentPassword: "old-password", newPassword: "new-password" }],
  ])("sends PATCH and JSON for %s", async (endpoint, body) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"success":true}'));
    vi.stubGlobal("fetch", fetchMock);

    await api.patch(endpoint, body);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(endpoint),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify(body) }),
    );
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
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

it("lets the browser encode multipart boundaries and sends DELETE explicitly", async () => {
 const fetchMock=vi.fn().mockImplementation(async()=>Response.json({success:true}));
 vi.stubGlobal("fetch",fetchMock);
 const form=new FormData();form.append("avatar",new File(["image"],"a.png",{type:"image/png"}));
 await api.post("/api/v1/profile/avatar",form);
 expect(fetchMock.mock.calls[0][1]).toMatchObject({method:"POST",body:form});
 expect(fetchMock.mock.calls[0][1].headers.has("Content-Type")).toBe(false);
 await api.delete("/api/v1/profile/avatar");
 expect(fetchMock.mock.calls[1][1].method).toBe("DELETE");
 vi.unstubAllGlobals();
});
