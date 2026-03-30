import type { DashboardPayload } from "@backend/dto/DashboardPayload";
import { normalizeDashboardCharts } from "@backend/domain/services/normalizeDashboardCharts";

export function parseDashboardPayload(value: unknown): DashboardPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.name !== "string" || candidate.name.trim().length === 0) {
    return null;
  }

  const charts = normalizeDashboardCharts(candidate.charts);

  return {
    version: 1,
    slug: typeof candidate.slug === "string" ? candidate.slug : undefined,
    name: candidate.name.trim(),
    filters: Array.isArray(candidate.filters) ? (candidate.filters as DashboardPayload["filters"]) : [],
    columns: Array.isArray(candidate.columns)
      ? (candidate.columns.filter((entry): entry is string => typeof entry === "string") as string[])
      : ["title", "path"],
    sort:
      candidate.sort && typeof candidate.sort === "object"
        ? (candidate.sort as DashboardPayload["sort"])
        : undefined,
    ...(charts ? { charts } : {})
  };
}
