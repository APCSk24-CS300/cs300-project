"use client";

import { useEffect, useState } from "react";
import type { SectionId } from "@/types/navigation";

function getHeaderOffset(): number {
  if (typeof window === "undefined") {
    return 72;
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--header-height")
    .trim();
  const parsed = Number.parseFloat(value);
  const headerHeight = Number.isFinite(parsed) ? parsed : 56;

  return headerHeight + 16;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type ScrollOptions = {
  updateHash?: boolean;
  focus?: boolean;
};

export function scrollToSection(
  id: SectionId | string,
  { updateHash = true, focus = false }: ScrollOptions = {},
): void {
  if (typeof document === "undefined") {
    return;
  }

  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  if (updateHash) {
    window.history.pushState(null, "", `#${id}`);
  }

  const top =
    element.getBoundingClientRect().top + window.scrollY - getHeaderOffset();

  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });

  if (focus) {
    element.focus({ preventScroll: true });
  }
}

export function scrollToHash(hash: string): void {
  const id = hash.replace(/^#/, "");

  if (id.length === 0) {
    return;
  }

  scrollToSection(id, { updateHash: false });
}

export function useHashScroll(): void {
  useEffect(() => {
    const restore = () => {
      if (window.location.hash) {
        window.requestAnimationFrame(() => scrollToHash(window.location.hash));
      }
    };

    restore();
    window.addEventListener("hashchange", restore);
    window.addEventListener("popstate", restore);

    return () => {
      window.removeEventListener("hashchange", restore);
      window.removeEventListener("popstate", restore);
    };
  }, []);
}

export function useScrollSpy(ids: SectionId[]): SectionId | null {
  const [activeId, setActiveId] = useState<SectionId | null>(ids[0] ?? null);
  const key = ids.join(",");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const sectionIds = key.split(",").filter(Boolean) as SectionId[];
    const visible = new Map<SectionId, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as SectionId;

          if (entry.isIntersecting) {
            visible.set(id, entry.intersectionRatio);
          } else {
            visible.delete(id);
          }
        }

        const next = sectionIds.find((id) => visible.has(id));

        if (next) {
          setActiveId(next);
        }
      },
      {
        rootMargin: `-${getHeaderOffset()}px 0px -55% 0px`,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const id of sectionIds) {
      const element = document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, [key]);

  return activeId;
}
