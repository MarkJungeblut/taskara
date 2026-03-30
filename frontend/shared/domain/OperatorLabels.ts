import type { FilterOperator } from "@backend/domain/models";

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  exists: "exists",
  not_exists: "not exists",
  equals: "equals",
  not_equals: "not equals",
  greater_than: "greater than",
  greater_than_or_equal: "greater than or equal",
  less_than: "less than",
  less_than_or_equal: "less than or equal",
  contains: "contains"
};
