import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { server } from "@/mocks/node";
import { resetMockDb } from "@/mocks/db/store";
import { TOKEN_STORAGE_KEY } from "@/libs/token-store";
import { SESSION_HINT_COOKIE } from "@/libs/session-hint";
import {
  getMockPathname,
  getMockSearchParams,
  mockRouter,
  resetMockNavigation,
} from "./navigation-mock";

process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080/api/v1";
process.env.NEXT_PUBLIC_API_MODE = "mock";

// One MSW handler set for app and tests (research R1).
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  // Node-environment tests (e.g. the /api/backend route handler) have no window or document.
  if (typeof window === "undefined") return;
  resetMockDb();
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  document.cookie = `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0`;
  resetMockNavigation();
});

afterEach(() => {
  cleanup();
});

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => getMockPathname(),
  useSearchParams: () => getMockSearchParams(),
  redirect: vi.fn(),
}));

vi.mock("next/image", async () => {
  const React = await import("react");

  return {
    default: function MockImage(props: Record<string, unknown>) {
      const rest = { ...props };
      const nonImageProps = [
        "fill",
        "preload",
        "priority",
        "sizes",
        "quality",
        "placeholder",
        "blurDataURL",
        "loader",
        "unoptimized",
      ];

      for (const key of nonImageProps) {
        delete rest[key];
      }

      return React.createElement("img", {
        ...rest,
        src: typeof props.src === "string" ? props.src : "",
        alt: typeof props.alt === "string" ? props.alt : "",
      });
    },
  };
});

vi.mock("next/link", async () => {
  const React = await import("react");

  return {
    default: React.forwardRef<HTMLAnchorElement, Record<string, unknown>>(
      function MockLink(props, ref) {
        const rest = { ...props };
        const href = rest.href;

        for (const key of [
          "href",
          "children",
          "prefetch",
          "replace",
          "scroll",
          "shallow",
          "passHref",
          "legacyBehavior",
          "locale",
        ]) {
          delete rest[key];
        }

        const resolvedHref =
          typeof href === "string"
            ? href
            : href &&
                typeof href === "object" &&
                "pathname" in href &&
                typeof href.pathname === "string"
              ? href.pathname
              : "#";

        return React.createElement(
          "a",
          { ...rest, href: resolvedHref, ref },
          props.children as React.ReactNode,
        );
      },
    ),
  };
});

// Node-environment tests (e.g. route handlers) have no window.
if (typeof window !== "undefined") Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];

  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn(() => []);
  unobserve = vi.fn();
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

class MockResizeObserver {
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal("ResizeObserver", MockResizeObserver);

if (typeof HTMLElement !== "undefined") {
  HTMLElement.prototype.scrollIntoView = vi.fn();
}

if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    if (!this.open) {
      return;
    }

    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

if (typeof window !== "undefined") {
  window.scrollTo = vi.fn();
}
