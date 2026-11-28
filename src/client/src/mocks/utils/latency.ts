import { delay as mswDelay } from "msw";

export const LOGIN_LATENCY_MS = 300;
export const DEFAULT_LATENCY_MS = 200;

/** Simulated latency, kept short in tests. */
export function delay(ms: number = DEFAULT_LATENCY_MS) {
  return mswDelay(process.env.NODE_ENV === "test" ? 5 : ms);
}
