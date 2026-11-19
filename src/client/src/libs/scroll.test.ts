import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { scrollToSection, useScrollSpy } from "@/libs/scroll";

const originalIntersectionObserver = globalThis.IntersectionObserver;

function makeRect(top: number): DOMRect {
  return {
    top,
    bottom: top,
    height: 0,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
}

afterEach(() => {
  globalThis.IntersectionObserver = originalIntersectionObserver;
  document.getElementById("activities")?.remove();
});

describe("scrollToSection", () => {
  it("updates the hash and applies the header offset", () => {
    const section = document.createElement("section");
    section.id = "activities";
    document.body.append(section);
    vi.spyOn(section, "getBoundingClientRect").mockReturnValue(makeRect(200));
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      getPropertyValue: (property: string) =>
        property === "--header-height" ? "80px" : "",
    } as CSSStyleDeclaration);
    const pushState = vi.spyOn(window.history, "pushState");

    scrollToSection("activities");

    expect(pushState).toHaveBeenCalledWith(null, "", "#activities");
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 104,
      behavior: "smooth",
    });

    section.remove();
  });

  it("scrolls immediately when reduced motion is preferred", () => {
    const section = document.createElement("section");
    section.id = "activities";
    document.body.append(section);
    vi.spyOn(section, "getBoundingClientRect").mockReturnValue(makeRect(0));
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);

    scrollToSection("activities", { updateHash: false });

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "auto",
    });

    section.remove();
  });

  it("does nothing when the target section is absent", () => {
    scrollToSection("missing-section");

    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});

describe("useScrollSpy", () => {
  it("selects the first visible section in document order", () => {
    let notify: IntersectionObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();

    class FakeIntersectionObserver {
      readonly root = null;
      readonly rootMargin = "";
      readonly thresholds = [];

      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }

      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
      takeRecords = () => [];
    }

    globalThis.IntersectionObserver =
      FakeIntersectionObserver as unknown as typeof IntersectionObserver;

    const { result, unmount } = renderHook(() =>
      useScrollSpy(["home", "activities", "services"]),
    );

    expect(result.current).toBe("home");

    act(() => {
      notify?.(
        [
          {
            target: { id: "services" },
            isIntersecting: true,
            intersectionRatio: 0.8,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(result.current).toBe("services");

    act(() => {
      notify?.(
        [
          {
            target: { id: "activities" },
            isIntersecting: true,
            intersectionRatio: 0.3,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(result.current).toBe("activities");

    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
