import { describe, expect, it } from "vitest";
import { formatActivityTime } from "./format";

describe("formatActivityTime", () => {
  it("formats a same-day activity", () => {
    expect(
      formatActivityTime(
        new Date("2026-10-17T08:00:00+07:00"),
        new Date("2026-10-17T10:00:00+07:00"),
      ),
    ).toBe("17/10/2026, 8:00 - 10:00");
  });

  it("formats a multi-day activity with both dates", () => {
    expect(
      formatActivityTime(
        new Date("2026-10-17T08:00:00+07:00"),
        new Date("2026-10-18T10:00:00+07:00"),
      ),
    ).toBe("17/10/2026 8:00 - 18/10/2026 10:00");
  });

  it("formats midnight without a leading hour zero", () => {
    expect(
      formatActivityTime(
        new Date("2026-10-17T00:05:00+07:00"),
        new Date("2026-10-17T00:30:00+07:00"),
      ),
    ).toBe("17/10/2026, 0:05 - 0:30");
  });

  it("keeps two-digit minutes", () => {
    expect(
      formatActivityTime(
        new Date("2026-10-17T09:05:00+07:00"),
        new Date("2026-10-17T09:07:00+07:00"),
      ),
    ).toBe("17/10/2026, 9:05 - 9:07");
  });

  it("uses the Asia/Ho_Chi_Minh timezone at the UTC boundary", () => {
    expect(
      formatActivityTime(
        new Date("2026-10-16T17:00:00Z"),
        new Date("2026-10-16T19:00:00Z"),
      ),
    ).toBe("17/10/2026, 0:00 - 2:00");
  });

  it("renders a safe fallback for invalid dates", () => {
    expect(formatActivityTime(new Date("invalid"), new Date())).toBe(
      "Invalid date",
    );
  });
});
