"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { getApiMode } from "@/libs/service-mode";

const MockModeContext = createContext(false);

/** True when the MSW mock answers API calls (shows the "Demo data" badge). */
export function useIsMockMode(): boolean {
  return useContext(MockModeContext);
}

/**
 * The single mock selection point (constitution C-IV v1.1.0): in mock mode, starts the MSW
 * browser worker before rendering, so every request goes over HTTP to the mock handlers.
 */
export function MockProvider({ children }: { children: ReactNode }) {
  const mockMode = getApiMode() === "mock";
  const [ready, setReady] = useState(!mockMode);

  useEffect(() => {
    if (!mockMode) return;
    let cancelled = false;
    (async () => {
      const [{ worker }, { installMockDevTools }] = await Promise.all([
        import("@/mocks/browser"),
        import("@/mocks/dev-tools"),
      ]);
      await worker.start({
        onUnhandledRequest: "bypass",
        quiet: true,
        serviceWorker: { url: "/mockServiceWorker.js" },
      });
      installMockDevTools();
      if (!cancelled) setReady(true);
    })().catch(() => {
      if (!cancelled) setReady(true); // fall through: requests then fail visibly as "unavailable"
    });
    return () => {
      cancelled = true;
    };
  }, [mockMode]);

  if (!ready) {
    return <LoadingState variant="page" label="Starting demo data…" />;
  }

  return <MockModeContext.Provider value={mockMode}>{children}</MockModeContext.Provider>;
}
