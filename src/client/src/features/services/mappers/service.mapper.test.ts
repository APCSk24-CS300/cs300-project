import { describe, expect, it } from "vitest";
import { isSafeHref, mapServiceListDTO } from "@/features/services/mappers/service.mapper";
import { DEFAULT_SERVICE_ICON, serviceIconFor, slugifyServiceName } from "@/features/services/config/icons";

const dto = (over: Record<string, unknown>) => ({
  id: "1", name: "Moodle", description: null, url: "https://moodle.hcmus.edu.vn/", displayOrder: 1, isActive: true, version: 1, ...over,
});

describe("service mapper", () => {
  it("maps DTOs to cards with an icon and href", () => {
    const [service] = mapServiceListDTO([dto({})]);
    expect(service).toEqual({
      id: "1", name: "Moodle", description: null, href: "https://moodle.hcmus.edu.vn/",
      icon: { src: "/images/services/moodle.png", alt: "" }, displayOrder: 1, isActive: true, version: 1,
    });
  });

  it("drops unsafe or malformed items", () => {
    const list = mapServiceListDTO([
      dto({ id: "1", url: "javascript:alert(1)" }),
      dto({ id: "2", url: "data:text/html,x" }),
      dto({ id: "3", name: "" }),
      null,
      dto({ id: "4", name: "Ok" }),
    ]);
    expect(list.map((s) => s.id)).toEqual(["4"]);
  });

  it("sorts by display order, then name, then id", () => {
    const list = mapServiceListDTO([
      dto({ id: "10", name: "beta", displayOrder: 2 }),
      dto({ id: "2", name: "Alpha", displayOrder: 2 }),
      dto({ id: "3", name: "Zed", displayOrder: 1 }),
    ]);
    expect(list.map((s) => s.name)).toEqual(["Zed", "Alpha", "beta"]);
  });

  it("returns an empty list for anything that is not an array", () => {
    expect(mapServiceListDTO(undefined)).toEqual([]);
    expect(mapServiceListDTO({})).toEqual([]);
  });

  it("isSafeHref accepts http(s) only", () => {
    expect(isSafeHref("http://a.edu")).toBe(true);
    expect(isSafeHref("ftp://a.edu")).toBe(false);
    expect(isSafeHref("not a url")).toBe(false);
  });

  it("picks icons by name slug with a fallback", () => {
    expect(slugifyServiceName("  Student Portal ")).toBe("student-portal");
    expect(serviceIconFor("IT Support")).toBe("/images/services/support.svg");
    expect(serviceIconFor("Thư viện")).toBe(DEFAULT_SERVICE_ICON);
  });
});
