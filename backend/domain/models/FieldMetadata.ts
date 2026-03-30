import type { FieldType } from "@backend/domain/models/FieldType";
import type { FilterOperator } from "@backend/domain/models/FilterOperator";
import type { SupportedFieldType } from "@backend/domain/models/SupportedFieldType";

export interface FieldMetadata {
  field: string;
  type: FieldType;
  observedTypes: SupportedFieldType[];
  allowedOperators: FilterOperator[];
}
