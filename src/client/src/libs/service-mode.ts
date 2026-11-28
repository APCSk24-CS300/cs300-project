export type ApiMode = "mock" | "real";
export type DataSource = "mock" | "api";

/**
 * The single mock/real selection point (constitution C-IV v1.1.0).
 * `NEXT_PUBLIC_API_MODE=mock|real`; the legacy `NEXT_PUBLIC_DATA_SOURCE=mock|api` is
 * still honored as a fallback. Defaults to `mock`.
 */
export function getApiMode(): ApiMode {
  const mode = process.env.NEXT_PUBLIC_API_MODE;
  if (mode === "real" || mode === "mock") {
    return mode;
  }
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "real" : "mock";
}

export function getDataSource(): DataSource {
  return getApiMode() === "real" ? "api" : "mock";
}

export function isMockDataSource(): boolean {
  return getApiMode() === "mock";
}
