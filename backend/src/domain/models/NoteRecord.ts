import type { NormalizedFieldValue } from "@backend/domain/models/NormalizedFieldValue";

export interface NoteRecord {
  absolutePath: string;
  path: string;
  title: string;
  modifiedAt: string;
  fields: Record<string, NormalizedFieldValue>;
}
