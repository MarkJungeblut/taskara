"use client";

import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";

import { fetchJson } from "@frontend/shared/infrastructure/fetchJson";
import type { DashboardFile, FieldMetadata, VaultStatus } from "@backend/domain/models";

interface WorkspaceState {
  status: VaultStatus | null;
  fields: FieldMetadata[];
  dashboards: DashboardFile[];
  loading: boolean;
  error: string | null;
  setDashboards: Dispatch<SetStateAction<DashboardFile[]>>;
  loadWorkspace: () => Promise<void>;
  rescanVault: () => Promise<void>;
}

export function useWorkspace(): WorkspaceState {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [fields, setFields] = useState<FieldMetadata[]>([]);
  const [dashboards, setDashboards] = useState<DashboardFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const revisionRef = useRef<number | null>(null);

  async function loadWorkspace(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const [nextStatus, nextFields, nextDashboards] = await Promise.all([
        fetchJson<VaultStatus>("/api/index/status"),
        fetchJson<FieldMetadata[]>("/api/fields"),
        fetchJson<DashboardFile[]>("/api/dashboards")
      ]);

      revisionRef.current = nextStatus.revision;
      setStatus(nextStatus);
      setFields(nextFields);
      setDashboards(nextDashboards);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the workspace.");
    } finally {
      setLoading(false);
    }
  }

  async function rescanVault(): Promise<void> {
    try {
      await fetchJson<{ ok: true }>("/api/index/rescan", { method: "POST" });
      await loadWorkspace();
    } catch (rescanError) {
      setError(rescanError instanceof Error ? rescanError.message : "Unable to rescan the vault.");
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const nextStatus = await fetchJson<VaultStatus>("/api/index/status");
        setStatus(nextStatus);

        if (revisionRef.current !== nextStatus.revision) {
          revisionRef.current = nextStatus.revision;
          const [nextFields, nextDashboards] = await Promise.all([
            fetchJson<FieldMetadata[]>("/api/fields"),
            fetchJson<DashboardFile[]>("/api/dashboards")
          ]);
          setFields(nextFields);
          setDashboards(nextDashboards);
        }
      } catch {
        // Keep polling quiet; the main error state is surfaced by explicit actions.
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return {
    status,
    fields,
    dashboards,
    loading,
    error,
    setDashboards,
    loadWorkspace,
    rescanVault
  };
}
