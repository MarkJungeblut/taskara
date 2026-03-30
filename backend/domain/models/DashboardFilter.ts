import type { FilterOperator } from "@backend/domain/models/FilterOperator";
import type { FilterValue } from "@backend/domain/models/FilterValue";

export interface DashboardFilter {
  field: string;
  operator: FilterOperator;
  value?: FilterValue;
}
