import fs from "node:fs/promises";
import path from "node:path";

import type { VaultScanner } from "@backend/infrastructure/vault/VaultScanner";
import type { FieldMetadata, FieldType, NoteRecord, ScanWarning, SupportedFieldType, VaultSnapshot } from "@backend/domain/models";
import { getAllowedOperators } from "@backend/domain/services/getAllowedOperators";
import { buildNoteRecord } from "@backend/infrastructure/vault/FrontmatterParser";

async function walkMarkdownFiles(rootPath: string): Promise<string[]> {
  const foundFiles: string[] = [];
  const entries = await fs.readdir(rootPath, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(rootPath, entry.name);

      if (entry.isDirectory()) {
        foundFiles.push(...(await walkMarkdownFiles(entryPath)));
        return;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        foundFiles.push(entryPath);
      }
    })
  );

  return foundFiles;
}

function buildFieldMetadata(notes: NoteRecord[]): FieldMetadata[] {
  const fieldTypeMap = new Map<string, Set<SupportedFieldType>>();

  for (const note of notes) {
    for (const [field, value] of Object.entries(note.fields)) {
      const existing = fieldTypeMap.get(field) ?? new Set<SupportedFieldType>();
      existing.add(value.type);
      fieldTypeMap.set(field, existing);
    }
  }

  return Array.from(fieldTypeMap.entries())
    .map(([field, observedTypeSet]) => {
      const observedTypes = Array.from(observedTypeSet.values()).sort();
      const type: FieldType = observedTypes.length === 1 ? observedTypes[0] : "mixed";

      return {
        field,
        type,
        observedTypes,
        allowedOperators: getAllowedOperators(type)
      };
    })
    .sort((left, right) => left.field.localeCompare(right.field));
}

export class FileSystemVaultScanner implements VaultScanner {
  async scan(vaultPath: string): Promise<VaultSnapshot> {
    const markdownFiles = await walkMarkdownFiles(vaultPath);
    const warnings: ScanWarning[] = [];
    const notes: NoteRecord[] = [];

    for (const filePath of markdownFiles) {
      const [source, stats] = await Promise.all([fs.readFile(filePath, "utf8"), fs.stat(filePath)]);
      const { note, warnings: noteWarnings } = buildNoteRecord({
        absolutePath: filePath,
        vaultRoot: vaultPath,
        source,
        modifiedAt: stats.mtime
      });

      notes.push(note);
      warnings.push(...noteWarnings);
    }

    return {
      notes: notes.sort((left, right) => left.path.localeCompare(right.path)),
      fields: buildFieldMetadata(notes),
      warnings,
      scannedAt: new Date().toISOString()
    };
  }
}
