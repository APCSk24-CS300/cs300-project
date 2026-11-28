import { beforeEach, describe, expect, it } from "vitest";
import { MockAdminHubService } from "@/features/services/admin/services/mock.admin-hub.service";
import { MockHubService } from "@/features/services/services/mock.hub.service";
import { mockServiceLinkStore } from "@/features/services/services/mock.store";
import { ApiError } from "@/libs/api-client";

describe("mock hub services", () => {
  beforeEach(() => mockServiceLinkStore.reset());

  it("hub shows active links only; admin changes show in the hub", async () => {
    const hub = new MockHubService(0);
    const admin = new MockAdminHubService(0);
    expect((await hub.listServices()).map((s) => s.name)).toEqual(["Moodle", "Student Portal", "Course Registration Portal", "Special Programs Portal", "Tuition Payment", "Student Handbook 2025"]);

    const created = await admin.create({ name: "E-learning", url: "https://e.hcmus.edu.vn" });
    expect(created.displayOrder).toBe(8);
    await admin.deactivate("1", 1);
    expect((await hub.listServices()).map((s) => s.name)).toEqual(["Student Portal", "Course Registration Portal", "Special Programs Portal", "Tuition Payment", "Student Handbook 2025", "E-learning"]);
  });

  it("enforces unique names and versions", async () => {
    const admin = new MockAdminHubService(0);
    await expect(admin.create({ name: " MOODLE", url: "https://x.edu" })).rejects.toMatchObject({ status: 409 });
    const saved = await admin.update("2", { description: "x" }, 1);
    expect(saved.version).toBe(2);
    await expect(admin.update("2", { description: "y" }, 1)).rejects.toBeInstanceOf(ApiError);
    await expect(admin.update("99", { description: "y" }, 1)).rejects.toMatchObject({ status: 404 });
  });
});
