export interface ScanWarning {
  type: "invalid_yaml" | "unsupported_value";
  path: string;
  field?: string;
  message: string;
}
