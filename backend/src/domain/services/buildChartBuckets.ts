import type { QueryResultRow } from "@backend/dto/QueryResultRow";

export const CHART_EMPTY_LABEL = "(empty)";

function valueToLabels(
  value: string | number | boolean | string[] | undefined
): string[] {
  if (typeof value === "undefined") {
    return [CHART_EMPTY_LABEL];
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [CHART_EMPTY_LABEL];
    }
    return value.map((entry) => String(entry));
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return [String(value)];
  }

  return [value];
}

export interface ChartBucket {
  label: string;
  count: number;
}

export function buildChartBuckets(rows: QueryResultRow[], groupBy: string): ChartBucket[] {
  const tallies = new Map<string, number>();

  for (const row of rows) {
    const raw = row.fields[groupBy];
    const labels = valueToLabels(raw);
    for (const label of labels) {
      tallies.set(label, (tallies.get(label) ?? 0) + 1);
    }
  }

  return Array.from(tallies.entries())
    .map(([label, count]) => ({ label, count }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.label.localeCompare(right.label, undefined, { sensitivity: "base" })
    );
}
