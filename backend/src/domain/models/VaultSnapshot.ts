import type { FieldMetadata } from "@backend/domain/models/FieldMetadata";
import type { NoteRecord } from "@backend/domain/models/NoteRecord";
import type { ScanWarning } from "@backend/domain/models/ScanWarning";

export interface VaultSnapshot {
  notes: NoteRecord[];
  fields: FieldMetadata[];
  warnings: ScanWarning[];
  scannedAt: string;
}
