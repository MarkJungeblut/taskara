export type DashboardChartType = "bar" | "pie";

export interface DashboardChart {
  title?: string;
  groupBy: string;
  chartType: DashboardChartType;
}
