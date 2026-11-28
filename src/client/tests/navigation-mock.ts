import { vi } from "vitest";

/**
 * Shared `next/navigation` mock (installed in tests/setup.ts). Tests read `mockRouter.replace`
 * calls and set the current route with `setMockRoute`.
 */
const state = { pathname: "/", search: "" };

export const mockRouter = {
  replace: vi.fn((href: string) => setMockRoute(href)),
  push: vi.fn((href: string) => setMockRoute(href)),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

export function setMockRoute(href: string): void {
  const url = new URL(href, "http://localhost");
  state.pathname = url.pathname;
  state.search = url.search;
}

export function getMockPathname(): string {
  return state.pathname;
}

export function getMockSearchParams(): URLSearchParams {
  return new URLSearchParams(state.search);
}

export function resetMockNavigation(): void {
  setMockRoute("/");
  mockRouter.replace.mockClear();
  mockRouter.push.mockClear();
}
