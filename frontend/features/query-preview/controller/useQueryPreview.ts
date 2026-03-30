"use client";

import { useEffect, useState } from "react";

import type { DashboardPayload } from "@backend/dto/DashboardPayload";
import type { QueryPreviewResponse } from "@backend/dto/QueryPreviewResponse";
import { ensureColumns } from "@frontend/features/dashboard-editor/model/dashboardDraft";
import { fetchJson } from "@frontend/shared/infrastructure/fetchJson";

interface QueryPreviewState {
  preview: QueryPreviewResponse;
  previewLoading: boolean;
  previewError: string | null;
}

export function useQueryPreview(draft: DashboardPayload): QueryPreviewState {
  const [preview, setPreview] = useState<QueryPreviewResponse>({ rows: [], total: 0 });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const chartGroupByFields = (draft.charts ?? []).map((chart) => chart.groupBy);
        const effectiveColumns = ensureColumns([...draft.columns, ...chartGroupByFields]);

        const nextPreview = await fetchJson<QueryPreviewResponse>("/api/query/preview", {
          method: "POST",
          body: JSON.stringify({
            filters: draft.filters,
            columns: effectiveColumns,
            sort: draft.sort
          })
        });

        setPreview(nextPreview);
      } catch (loadError) {
        setPreviewError(
          loadError instanceof Error ? loadError.message : "Unable to preview this dashboard."
        );
      } finally {
        setPreviewLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [draft]);

  return {
    preview,
    previewLoading,
    previewError
  };
}
