"use client";

import { useState } from "react";

import type { DashboardPayload } from "@backend/dto/DashboardPayload";
import type { DashboardFile } from "@backend/domain/models";
import { ensureColumns } from "@frontend/features/dashboard-editor/model/dashboardDraft";
import { fetchJson } from "@frontend/shared/infrastructure/fetchJson";

interface DashboardFileActions {
  saving: boolean;
  saveDashboard: (draft: DashboardPayload) => Promise<DashboardFile>;
  deleteDashboard: (slug: string) => Promise<void>;
  listDashboards: () => Promise<DashboardFile[]>;
}

export function useDashboardFileActions(): DashboardFileActions {
  const [saving, setSaving] = useState(false);

  async function saveDashboard(draft: DashboardPayload): Promise<DashboardFile> {
    setSaving(true);
    try {
      return draft.slug
        ? await fetchJson<DashboardFile>(`/api/dashboards/${draft.slug}`, {
            method: "PUT",
            body: JSON.stringify({
              ...draft,
              columns: ensureColumns(draft.columns)
            })
          })
        : await fetchJson<DashboardFile>("/api/dashboards", {
            method: "POST",
            body: JSON.stringify({
              ...draft,
              columns: ensureColumns(draft.columns)
            })
          });
    } finally {
      setSaving(false);
    }
  }

  async function deleteDashboard(slug: string): Promise<void> {
    await fetchJson<{ deleted: boolean }>(`/api/dashboards/${slug}`, {
      method: "DELETE"
    });
  }

  async function listDashboards(): Promise<DashboardFile[]> {
    return fetchJson<DashboardFile[]>("/api/dashboards");
  }

  return {
    saving,
    saveDashboard,
    deleteDashboard,
    listDashboards
  };
}
