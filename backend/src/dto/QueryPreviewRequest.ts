import type { DashboardFilter, DashboardSort } from "@backend/domain/models";

export interface QueryPreviewRequest {
  filters: DashboardFilter[];
  columns: string[];
  sort?: DashboardSort;
}
