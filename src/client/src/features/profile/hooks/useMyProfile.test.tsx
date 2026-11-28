import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { setMockFailures } from "@/mocks/db/store";
import { signInAs } from "../../../../tests/test-utils";

describe("useMyProfile (useAsyncResource, MSW)", () => {
  it("loads the caller's profile, applies a saved change and drops it on retry", async () => {
    signInAs("student1@example.invalid");
    const { result } = renderHook(() => useMyProfile());
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.profile).toMatchObject({ fullName: "Nguyễn Văn An", phoneNumber: null });

    act(() => result.current.apply({ phoneNumber: "0901234567" }));
    expect(result.current.profile?.phoneNumber).toBe("0901234567");

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.profile?.phoneNumber).toBeNull(); // the server still has null
  });

  it("reports an error and recovers on retry (A9)", async () => {
    setMockFailures(["getProfile"]);
    signInAs("student1@example.invalid");
    const { result } = renderHook(() => useMyProfile());
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.profile).toBeNull();
    setMockFailures([]);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("success"));
  });
});
