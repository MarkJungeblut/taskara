import type { QueryResultRow } from "@backend/dto/QueryResultRow";

export interface QueryPreviewResponse {
  rows: QueryResultRow[];
  total: number;
}
