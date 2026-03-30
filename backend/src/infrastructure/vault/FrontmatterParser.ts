import path from "node:path";
import { parse as parseYaml } from "yaml";

import type { NormalizedFieldValue, NoteRecord, ScanWarning } from "@backend/domain/models";
import { toPosixPath } from "@backend/infrastructure/vault/models/VaultConfig";

const FRONTMATTER_PATTERN = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDateLike(value: string | Date): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string" && DATE_ONLY_PATTERN.test(value)) {
    return value;
  }

  return null;
}

function normalizeYamlValue(
  value: unknown,
  pathLabel: string,
  field: string,
  warnings: ScanWarning[]
): NormalizedFieldValue | null {
  if (typeof value === "string") {
    const normalizedDate = normalizeDateLike(value);

    if (normalizedDate) {
      return { type: "date", value: normalizedDate };
    }

    return { type: "string", value };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return { type: "number", value };
  }

  if (typeof value === "boolean") {
    return { type: "boolean", value };
  }

  if (value instanceof Date) {
    const normalizedDate = normalizeDateLike(value);

    if (normalizedDate) {
      return { type: "date", value: normalizedDate };
    }
  }

  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) {
      return { type: "string_list", value };
    }

    warnings.push({
      type: "unsupported_value",
      path: pathLabel,
      field,
      message: `Field "${field}" is ignored because only lists of strings are supported.`
    });
    return null;
  }

  if (value === null || typeof value === "undefined") {
    warnings.push({
      type: "unsupported_value",
      path: pathLabel,
      field,
      message: `Field "${field}" is ignored because null values are not supported.`
    });
    return null;
  }

  warnings.push({
    type: "unsupported_value",
    path: pathLabel,
    field,
    message: `Field "${field}" is ignored because nested YAML values are not supported.`
  });
  return null;
}

export function parseFrontmatterBlock(
  source: string,
  pathLabel: string
): {
  fields: Record<string, NormalizedFieldValue>;
  warnings: ScanWarning[];
} {
  const warnings: ScanWarning[] = [];
  const match = source.match(FRONTMATTER_PATTERN);

  if (!match) {
    return { fields: {}, warnings };
  }

  try {
    const parsed = parseYaml(match[1]);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      warnings.push({
        type: "invalid_yaml",
        path: pathLabel,
        message: "Frontmatter is ignored because it does not contain a YAML object."
      });
      return { fields: {}, warnings };
    }

    const normalizedEntries = Object.entries(parsed).flatMap(([field, value]) => {
      const normalized = normalizeYamlValue(value, pathLabel, field, warnings);

      if (!normalized) {
        return [];
      }

      return [[field, normalized] as const];
    });

    return {
      fields: Object.fromEntries(normalizedEntries),
      warnings
    };
  } catch (error) {
    warnings.push({
      type: "invalid_yaml",
      path: pathLabel,
      message:
        error instanceof Error
          ? `Frontmatter is ignored because it is invalid YAML: ${error.message}`
          : "Frontmatter is ignored because it is invalid YAML."
    });
    return { fields: {}, warnings };
  }
}

export function buildNoteRecord(input: {
  absolutePath: string;
  vaultRoot: string;
  source: string;
  modifiedAt: Date;
}): { note: NoteRecord; warnings: ScanWarning[] } {
  const relativePath = toPosixPath(path.relative(input.vaultRoot, input.absolutePath));
  const { fields, warnings } = parseFrontmatterBlock(input.source, relativePath);
  const title =
    typeof fields.title?.value === "string"
      ? fields.title.value
      : path.basename(relativePath, path.extname(relativePath));

  return {
    note: {
      absolutePath: input.absolutePath,
      path: relativePath,
      title,
      modifiedAt: input.modifiedAt.toISOString(),
      fields
    },
    warnings
  };
}
