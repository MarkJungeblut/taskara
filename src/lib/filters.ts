import type { FieldMetadata, FieldType, FilterOperator } from "@/lib/types";

const BASE_OPERATORS: FilterOperator[] = [
  "exists",
  "not_exists",
  "equals",
  "not_equals"
];

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

export function getFieldTypeMap(fields: FieldMetadata[]): Map<string, FieldMetadata> {
  return new Map(fields.map((field) => [field.field, field]));
}
