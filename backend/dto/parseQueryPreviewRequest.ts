import type { QueryPreviewRequest } from "@backend/dto/QueryPreviewRequest";

export function parseQueryPreviewRequest(value: unknown): QueryPreviewRequest {
  if (!value || typeof value !== "object") {
    return { filters: [], columns: ["title", "path"] };
  }

  const candidate = value as Record<string, unknown>;

  return {
    filters: Array.isArray(candidate.filters) ? (candidate.filters as QueryPreviewRequest["filters"]) : [],
    columns: Array.isArray(candidate.columns)
      ? candidate.columns.filter((entry): entry is string => typeof entry === "string")
      : ["title", "path"],
    sort:
      candidate.sort && typeof candidate.sort === "object"
        ? (candidate.sort as QueryPreviewRequest["sort"])
        : undefined
  };
}
