import type { DashboardPayload } from "@backend/dto/DashboardPayload";

export const REQUIRED_COLUMNS = ["title", "path"];

export function createEmptyDashboard(): DashboardPayload {
  return {
    version: 1,
    name: "Untitled Dashboard",
    filters: [],
    columns: [...REQUIRED_COLUMNS]
  };
}

export function ensureColumns(columns: string[]): string[] {
  return Array.from(new Set([...REQUIRED_COLUMNS, ...columns]));
}
