import type {
  DashboardFilter,
  FieldMetadata,
  FilterValue,
  NoteRecord,
  QueryPreviewRequest,
  QueryPreviewResponse,
  QueryResultRow,
  SupportedFieldType
} from "@/lib/types";

function compareAsNumber(left: number, right: number, operator: DashboardFilter["operator"]): boolean {
  switch (operator) {
    case "greater_than":
      return left > right;
    case "greater_than_or_equal":
      return left >= right;
    case "less_than":
      return left < right;
    case "less_than_or_equal":
      return left <= right;
    default:
      return false;
  }
}

function compareAsString(left: string, right: string, operator: DashboardFilter["operator"]): boolean {
  switch (operator) {
    case "equals":
      return left === right;
    case "not_equals":
      return left !== right;
    case "contains":
      return left.toLowerCase().includes(right.toLowerCase());
    case "greater_than":
      return left > right;
    case "greater_than_or_equal":
      return left >= right;
    case "less_than":
      return left < right;
    case "less_than_or_equal":
      return left <= right;
    default:
      return false;
  }
}

function normalizeFilterValue(value: FilterValue | undefined, type: SupportedFieldType): FilterValue | undefined {
  if (typeof value === "undefined") {
    return undefined;
  }

  if (type === "number") {
    if (typeof value === "number") {
      return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (type === "boolean") {
    if (typeof value === "boolean") {
      return value;
    }

    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    return undefined;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return undefined;
}

function matchesFilter(note: NoteRecord, filter: DashboardFilter): boolean {
  const recordValue = note.fields[filter.field];

  if (filter.operator === "exists") {
    return Boolean(recordValue);
  }

  if (filter.operator === "not_exists") {
    return !recordValue;
  }

  if (!recordValue) {
    return false;
  }

  if (recordValue.type === "string_list") {
    if (filter.operator === "contains" && typeof filter.value !== "undefined") {
      return recordValue.value.some(
        (entry) => entry.toLowerCase() === String(filter.value).toLowerCase()
      );
    }

    if (filter.operator === "equals" && Array.isArray(recordValue.value)) {
      return recordValue.value.join(",") === String(filter.value);
    }

    if (filter.operator === "not_equals" && Array.isArray(recordValue.value)) {
      return recordValue.value.join(",") !== String(filter.value);
    }

    return false;
  }

  const normalizedValue = normalizeFilterValue(filter.value, recordValue.type);

  if (typeof normalizedValue === "undefined") {
    return false;
  }

  switch (recordValue.type) {
    case "string":
    case "date":
      return compareAsString(recordValue.value, String(normalizedValue), filter.operator);
    case "number":
      return compareAsNumber(recordValue.value, Number(normalizedValue), filter.operator);
    case "boolean":
      if (filter.operator === "equals") {
        return recordValue.value === normalizedValue;
      }

      if (filter.operator === "not_equals") {
        return recordValue.value !== normalizedValue;
      }

      return false;
    default:
      return false;
  }
}

function sortRows(rows: QueryResultRow[], sort: QueryPreviewRequest["sort"]): QueryResultRow[] {
  if (!sort) {
    return rows;
  }

  const direction = sort.direction === "desc" ? -1 : 1;

  return [...rows].sort((left, right) => {
    const leftValue =
      sort.field === "title" || sort.field === "path" || sort.field === "modifiedAt"
        ? left[sort.field]
        : left.fields[sort.field];
    const rightValue =
      sort.field === "title" || sort.field === "path" || sort.field === "modifiedAt"
        ? right[sort.field]
        : right.fields[sort.field];

    if (typeof leftValue === "undefined" && typeof rightValue === "undefined") {
      return 0;
    }

    if (typeof leftValue === "undefined") {
      return 1;
    }

    if (typeof rightValue === "undefined") {
      return -1;
    }

    const leftComparable = Array.isArray(leftValue) ? leftValue.join(", ") : String(leftValue);
    const rightComparable = Array.isArray(rightValue) ? rightValue.join(", ") : String(rightValue);

    return leftComparable.localeCompare(rightComparable, undefined, {
      numeric: true,
      sensitivity: "base"
    }) * direction;
  });
}

function buildRow(
  note: NoteRecord,
  columns: string[],
  obsidianUrl: string
): QueryResultRow {
  const fieldValues = Object.fromEntries(
    columns.map((column) => [column, note.fields[column]?.value])
  );

  return {
    title: note.title,
    path: note.path,
    modifiedAt: note.modifiedAt,
    obsidianUrl,
    fields: fieldValues
  };
}

export function buildPreview(
  notes: NoteRecord[],
  request: QueryPreviewRequest,
  buildObsidianUrl: (notePath: string) => string,
  fields: FieldMetadata[]
): QueryPreviewResponse {
  const fieldSet = new Set(fields.map((field) => field.field));
  const normalizedColumns = Array.from(new Set(["title", "path", ...request.columns])).filter(
    (column) => column === "title" || column === "path" || column === "modifiedAt" || fieldSet.has(column)
  );

  const matched = notes.filter((note) => request.filters.every((filter) => matchesFilter(note, filter)));
  const rows = matched.map((note) => buildRow(note, normalizedColumns, buildObsidianUrl(note.path)));

  return {
    rows: sortRows(rows, request.sort),
    total: rows.length
  };
}
