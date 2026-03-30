import type { FieldType, FilterOperator } from "@backend/domain/models";

const BASE_OPERATORS: FilterOperator[] = ["exists", "not_exists", "equals", "not_equals"];

export function getAllowedOperators(fieldType: FieldType): FilterOperator[] {
  switch (fieldType) {
    case "number":
    case "date":
      return [
        ...BASE_OPERATORS,
        "greater_than",
        "greater_than_or_equal",
        "less_than",
        "less_than_or_equal"
      ];
    case "string":
    case "string_list":
      return [...BASE_OPERATORS, "contains"];
    case "boolean":
    case "mixed":
      return BASE_OPERATORS;
    default:
      return BASE_OPERATORS;
  }
}
