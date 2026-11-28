import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/libs/api-client";
import { authService } from "@/features/auth/services/auth.service";
import type { ChangePasswordRequest, MessageResponse } from "@/features/auth/types/auth.dto";

vi.mock("@/libs/api-client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const patchMock = vi.mocked(api.patch);

beforeEach(() => {
  patchMock.mockReset();
});

describe("authService.changePassword", () => {
  it("uses the official profile password endpoint and contract body", async () => {
    const request: ChangePasswordRequest = {
      currentPassword: "current-secret",
      newPassword: "new-secret-password",
    };
    const response: MessageResponse = {
      success: true,
      message: "Password changed successfully.",
    };
    patchMock.mockResolvedValueOnce(response);

    await expect(authService.changePassword(request)).resolves.toEqual(response);

    expect(patchMock).toHaveBeenCalledWith("/api/v1/profile/password", request);
  });
});
