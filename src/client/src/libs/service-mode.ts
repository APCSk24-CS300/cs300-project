export type DataSource = "mock" | "api";

export function getDataSource(): DataSource {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "api" : "mock";
}

export function isMockDataSource(): boolean {
  return getDataSource() === "mock";
}
