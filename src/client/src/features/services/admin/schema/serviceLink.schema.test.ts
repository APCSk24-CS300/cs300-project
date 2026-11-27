import { describe, expect, it } from "vitest";
import { ServiceLinkFormSchema, toServiceLinkPayload } from "@/features/services/admin/schema/serviceLink.schema";

const valid = { name: " Moodle ", url: " https://moodle.hcmus.edu.vn/ ", description: "", displayOrder: "", isActive: true };

function messages(values: Record<string, unknown>) {
  const r = ServiceLinkFormSchema.safeParse(values);
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
}

describe("ServiceLinkFormSchema", () => {
  it("trims and builds the API body; empty order and description are left to the backend", () => {
    const parsed = ServiceLinkFormSchema.parse(valid);
    expect(toServiceLinkPayload(parsed)).toEqual({ name: "Moodle", url: "https://moodle.hcmus.edu.vn/", description: null, isActive: true });
    expect(toServiceLinkPayload(ServiceLinkFormSchema.parse({ ...valid, displayOrder: "4", description: "Hi" }))).toMatchObject({ displayOrder: 4, description: "Hi" });
  });

  it("matches the backend URL rules", () => {
    for (const url of ["javascript:alert(1)", "ftp://x.edu", "moodle.hcmus.edu.vn", "https://u:p@x.edu", "https://a b.edu"]) {
      expect(messages({ ...valid, url }).url, url).toBe("Use a full http:// or https:// address");
    }
  });

  it("checks required fields, lengths and order", () => {
    expect(messages({ ...valid, name: "  ", url: "" })).toEqual({ name: "Enter a name", url: "Enter the service address" });
    expect(messages({ ...valid, name: "n".repeat(101) }).name).toBe("Use at most 100 characters");
    expect(messages({ ...valid, description: "d".repeat(501) }).description).toBe("Use at most 500 characters");
    expect(messages({ ...valid, displayOrder: "-1" }).displayOrder).toBe("Order must be a whole number");
    expect(messages({ ...valid, displayOrder: "10000" }).displayOrder).toBe("Order must be between 0 and 9999");
  });
});
