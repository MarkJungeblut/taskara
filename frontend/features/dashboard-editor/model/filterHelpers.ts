import type { FieldMetadata, FilterOperator } from "@backend/domain/models";

export function getOperatorOptions(field: FieldMetadata | undefined): FilterOperator[] {
  return field?.allowedOperators ?? ["exists", "not_exists", "equals", "not_equals"];
}

export function needsValue(operator: FilterOperator): boolean {
  return operator !== "exists" && operator !== "not_exists";
}
