export type SupportedFieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "string_list";

export type FieldType = SupportedFieldType | "mixed";

export type FilterOperator =
  | "exists"
  | "not_exists"
  | "equals"
  | "not_equals"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  | "contains";

export type FilterValue = string | number | boolean;

export type NormalizedFieldValue =
  | {
      type: "string";
      value: string;
    }
  | {
      type: "number";
      value: number;
    }
  | {
      type: "boolean";
      value: boolean;
    }
  | {
      type: "date";
      value: string;
    }
  | {
      type: "string_list";
      value: string[];
    };

export interface NoteRecord {
  absolutePath: string;
  path: string;
  title: string;
  modifiedAt: string;
  fields: Record<string, NormalizedFieldValue>;
}

export interface ScanWarning {
  type: "invalid_yaml" | "unsupported_value";
  path: string;
  field?: string;
  message: string;
}

export interface FieldMetadata {
  field: string;
  type: FieldType;
  observedTypes: SupportedFieldType[];
  allowedOperators: FilterOperator[];
}

export interface DashboardFilter {
  field: string;
  operator: FilterOperator;
  value?: FilterValue;
}

export interface DashboardSort {
  field: string;
  direction: "asc" | "desc";
}

export interface DashboardDefinition {
  version: 1;
  name: string;
  filters: DashboardFilter[];
  columns: string[];
  sort?: DashboardSort;
}

export interface DashboardFile extends DashboardDefinition {
  slug: string;
  filePath: string;
  updatedAt: string;
}

export interface DashboardPayload extends DashboardDefinition {
  slug?: string;
}

export interface QueryPreviewRequest {
  filters: DashboardFilter[];
  columns: string[];
  sort?: DashboardSort;
}

export interface QueryResultRow {
  title: string;
  path: string;
  modifiedAt: string;
  obsidianUrl: string;
  fields: Record<string, string | number | boolean | string[] | undefined>;
}

export interface QueryPreviewResponse {
  rows: QueryResultRow[];
  total: number;
}

export interface VaultSnapshot {
  notes: NoteRecord[];
  fields: FieldMetadata[];
  warnings: ScanWarning[];
  scannedAt: string;
}

export interface VaultStatus {
  vaultPath: string;
  vaultName: string;
  noteCount: number;
  fieldCount: number;
  warningCount: number;
  warnings: ScanWarning[];
  scannedAt: string | null;
  dashboardsPath: string;
  revision: number;
  isReady: boolean;
  isScanning: boolean;
  lastError: string | null;
}
