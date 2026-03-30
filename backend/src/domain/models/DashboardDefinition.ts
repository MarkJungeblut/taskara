import type { DashboardChart } from "@backend/domain/models/DashboardChart";
import type { DashboardFilter } from "@backend/domain/models/DashboardFilter";
import type { DashboardSort } from "@backend/domain/models/DashboardSort";

export interface DashboardDefinition {
  version: 1;
  name: string;
  filters: DashboardFilter[];
  columns: string[];
  sort?: DashboardSort;
  charts?: DashboardChart[];
}
