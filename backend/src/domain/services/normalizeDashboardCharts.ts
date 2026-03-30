import type { DashboardChart } from "@backend/domain/models";

export function normalizeDashboardCharts(raw: unknown): DashboardChart[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }

  const normalized: DashboardChart[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const candidate = entry as Record<string, unknown>;

    if (typeof candidate.groupBy !== "string" || candidate.groupBy.trim().length === 0) {
      continue;
    }

    const chartType = candidate.chartType;
    if (chartType !== "bar" && chartType !== "pie") {
      continue;
    }

    const chart: DashboardChart = {
      groupBy: candidate.groupBy.trim(),
      chartType
    };

    if (typeof candidate.title === "string" && candidate.title.trim().length > 0) {
      chart.title = candidate.title.trim();
    }

    normalized.push(chart);
  }

  return normalized.length > 0 ? normalized : undefined;
}
