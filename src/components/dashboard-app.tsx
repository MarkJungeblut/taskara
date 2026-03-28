"use client";

import { useEffect, useRef, useState } from "react";

import { OPERATOR_LABELS } from "@/lib/filters";
import type {
  DashboardFile,
  DashboardFilter,
  DashboardPayload,
  FieldMetadata,
  FilterOperator,
  QueryPreviewResponse,
  VaultStatus
} from "@/lib/types";

const REQUIRED_COLUMNS = ["title", "path"];

function createEmptyDashboard(): DashboardPayload {
  return {
    version: 1,
    name: "Untitled Dashboard",
    filters: [],
    columns: [...REQUIRED_COLUMNS]
  };
}

function ensureColumns(columns: string[]): string[] {
  return Array.from(new Set([...REQUIRED_COLUMNS, ...columns]));
}

function getOperatorOptions(field: FieldMetadata | undefined): FilterOperator[] {
  return field?.allowedOperators ?? ["exists", "not_exists", "equals", "not_equals"];
}

function needsValue(operator: FilterOperator): boolean {
  return operator !== "exists" && operator !== "not_exists";
}

function formatValue(value: string | number | boolean | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return typeof value === "undefined" ? "" : String(value);
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Not scanned yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export function DashboardApp() {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [fields, setFields] = useState<FieldMetadata[]>([]);
  const [dashboards, setDashboards] = useState<DashboardFile[]>([]);
  const [draft, setDraft] = useState<DashboardPayload>(createEmptyDashboard);
  const [preview, setPreview] = useState<QueryPreviewResponse>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const revisionRef = useRef<number | null>(null);

  const availableColumns = Array.from(
    new Set(["title", "path", "modifiedAt", ...fields.map((field) => field.field)])
  );

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

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const nextPreview = await fetchJson<QueryPreviewResponse>("/api/query/preview", {
          method: "POST",
          body: JSON.stringify({
            filters: draft.filters,
            columns: ensureColumns(draft.columns),
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

  function updateDraft(partial: Partial<DashboardPayload>): void {
    setDraft((current) => ({
      ...current,
      ...partial,
      columns: ensureColumns(partial.columns ?? current.columns)
    }));
  }

  function addFilter(): void {
    const fallbackField = fields[0];
    const operator = fallbackField?.allowedOperators[0] ?? "exists";

    setDraft((current) => ({
      ...current,
      filters: [
        ...current.filters,
        {
          field: fallbackField?.field ?? "",
          operator
        }
      ]
    }));
  }

  function updateFilter(index: number, partial: Partial<DashboardFilter>): void {
    setDraft((current) => {
      const nextFilters = current.filters.map((filter, filterIndex) => {
        if (filterIndex !== index) {
          return filter;
        }

        const nextField = partial.field ?? filter.field;
        const fieldMeta = fields.find((entry) => entry.field === nextField);
        const allowedOperators = getOperatorOptions(fieldMeta);
        const requestedOperator = partial.operator ?? filter.operator;
        const nextOperator = allowedOperators.includes(requestedOperator)
          ? requestedOperator
          : allowedOperators[0];

        return {
          ...filter,
          ...partial,
          field: nextField,
          operator: nextOperator,
          value: needsValue(nextOperator) ? partial.value ?? filter.value : undefined
        };
      });

      return {
        ...current,
        filters: nextFilters
      };
    });
  }

  function removeFilter(index: number): void {
    setDraft((current) => ({
      ...current,
      filters: current.filters.filter((_, filterIndex) => filterIndex !== index)
    }));
  }

  function toggleColumn(column: string): void {
    if (REQUIRED_COLUMNS.includes(column)) {
      return;
    }

    setDraft((current) => {
      const hasColumn = current.columns.includes(column);
      const nextColumns = hasColumn
        ? current.columns.filter((entry) => entry !== column)
        : [...current.columns, column];

      return {
        ...current,
        columns: ensureColumns(nextColumns)
      };
    });
  }

  async function saveDashboard(): Promise<void> {
    if (!draft.name.trim()) {
      setError("Please add a dashboard name before saving.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const saved = draft.slug
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

      const nextDashboards = await fetchJson<DashboardFile[]>("/api/dashboards");
      setDashboards(nextDashboards);
      setDraft(saved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the dashboard.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDashboard(): Promise<void> {
    if (!draft.slug) {
      return;
    }

    const confirmed = window.confirm(`Delete dashboard "${draft.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await fetchJson<{ deleted: boolean }>(`/api/dashboards/${draft.slug}`, {
        method: "DELETE"
      });
      const nextDashboards = await fetchJson<DashboardFile[]>("/api/dashboards");
      setDashboards(nextDashboards);
      setDraft(createEmptyDashboard());
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unable to delete the dashboard."
      );
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

  const warningPreview = status?.warnings.slice(0, 5) ?? [];
  const activeColumns = ensureColumns(draft.columns);

  return (
    <main className="shell">
      <div className="frame">
        <section className="hero">
          <div className="hero-inner">
            <div>
              <span className="eyebrow">Taskara v1</span>
              <h1>Local dashboards for Markdown frontmatter</h1>
              <p>
                Browse one Obsidian vault, discover frontmatter fields dynamically, and save
                reusable dashboards as YAML files inside the vault.
              </p>
            </div>
            <div className="status-grid">
              <div className="stat-card">
                <span className="stat-label">Notes</span>
                <span className="stat-value">{status?.noteCount ?? 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Fields</span>
                <span className="stat-value">{status?.fieldCount ?? 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Dashboards</span>
                <span className="stat-value">{dashboards.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Last scan</span>
                <span className="subtle">{formatTimestamp(status?.scannedAt ?? null)}</span>
              </div>
            </div>
          </div>
        </section>

        {error ? <div className="error">{error}</div> : null}

        <section className="workspace">
          <aside className="panel sidebar">
            <div className="stack">
              <div className="section-title">
                <h2>Vault status</h2>
                <span className="badge">{status?.isScanning ? "Scanning…" : "Watching"}</span>
              </div>
              <div className="subtle">{status?.vaultPath ?? "Loading vault path…"}</div>
              <div className="subtle">Dashboards: {status?.dashboardsPath ?? "Loading…"}</div>
              <div className="button-row">
                <button className="button" type="button" onClick={() => setDraft(createEmptyDashboard())}>
                  New dashboard
                </button>
                <button className="button" type="button" onClick={() => void rescanVault()}>
                  Rescan vault
                </button>
              </div>
            </div>

            <div className="stack">
              <div className="section-title">
                <h2>Saved dashboards</h2>
              </div>
              <div className="dashboard-list">
                {dashboards.length === 0 ? (
                  <div className="empty">No saved dashboards yet.</div>
                ) : (
                  dashboards.map((dashboard) => (
                    <button
                      key={dashboard.slug}
                      className={`dashboard-item ${dashboard.slug === draft.slug ? "active" : ""}`}
                      type="button"
                      onClick={() => setDraft(dashboard)}
                    >
                      <strong>{dashboard.name}</strong>
                      <div className="meta">{dashboard.slug}.yaml</div>
                      <div className="meta">{dashboard.filters.length} filters</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="stack">
              <div className="section-title">
                <h2>Discovered fields</h2>
              </div>
              <div className="pill-list">
                {fields.map((field) => (
                  <span key={field.field} className="pill">
                    {field.field}
                    <span className="meta">{field.type}</span>
                  </span>
                ))}
              </div>
            </div>

            {warningPreview.length > 0 ? (
              <div className="stack">
                <div className="section-title">
                  <h2>Scan warnings</h2>
                </div>
                <div className="warning-list">
                  {warningPreview.map((warning, index) => (
                    <div className="warning" key={`${warning.path}-${warning.field ?? index}`}>
                      <strong>{warning.path}</strong>
                      <div className="subtle">{warning.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>

          <section className="panel main">
            <div className="section-title">
              <h2>Dashboard editor</h2>
              <div className="button-row">
                {draft.slug ? (
                  <button className="button danger" type="button" onClick={() => void deleteDashboard()}>
                    Delete
                  </button>
                ) : null}
                <button className="button primary" type="button" onClick={() => void saveDashboard()}>
                  {saving ? "Saving…" : "Save dashboard"}
                </button>
              </div>
            </div>

            <div className="grid-two">
              <div className="field">
                <label htmlFor="dashboard-name">Dashboard name</label>
                <input
                  id="dashboard-name"
                  className="input"
                  value={draft.name}
                  onChange={(event) => updateDraft({ name: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="dashboard-sort-field">Sort by</label>
                <div className="grid-two">
                  <select
                    id="dashboard-sort-field"
                    className="select"
                    value={draft.sort?.field ?? ""}
                    onChange={(event) => {
                      const field = event.target.value;

                      if (!field) {
                        updateDraft({ sort: undefined });
                        return;
                      }

                      updateDraft({
                        sort: {
                          field,
                          direction: draft.sort?.direction ?? "asc"
                        }
                      });
                    }}
                  >
                    <option value="">No sorting</option>
                    {availableColumns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                  <select
                    className="select"
                    value={draft.sort?.direction ?? "asc"}
                    disabled={!draft.sort}
                    onChange={(event) =>
                      updateDraft({
                        sort: draft.sort
                          ? {
                              ...draft.sort,
                              direction: event.target.value as "asc" | "desc"
                            }
                          : undefined
                      })
                    }
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="section-title">
                <h3>Filters</h3>
                <button className="button" type="button" onClick={addFilter}>
                  Add filter
                </button>
              </div>
              {draft.filters.length === 0 ? (
                <div className="empty">No filters yet. Add one to narrow down the vault.</div>
              ) : (
                draft.filters.map((filter, index) => {
                  const fieldMeta = fields.find((field) => field.field === filter.field);
                  const operators = getOperatorOptions(fieldMeta);
                  const fieldType = fieldMeta?.type ?? "string";

                  return (
                    <div key={`${filter.field}-${index}`} className="field-row">
                      <div className="field">
                        <label>Field</label>
                        <select
                          className="select"
                          value={filter.field}
                          onChange={(event) => updateFilter(index, { field: event.target.value })}
                        >
                          <option value="">Choose a field</option>
                          {fields.map((field) => (
                            <option key={field.field} value={field.field}>
                              {field.field} ({field.type})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label>Operator</label>
                        <select
                          className="select"
                          value={filter.operator}
                          onChange={(event) =>
                            updateFilter(index, { operator: event.target.value as FilterOperator })
                          }
                        >
                          {operators.map((operator) => (
                            <option key={operator} value={operator}>
                              {OPERATOR_LABELS[operator]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label>Value</label>
                        {needsValue(filter.operator) ? (
                          fieldType === "boolean" ? (
                            <select
                              className="select"
                              value={String(filter.value ?? "true")}
                              onChange={(event) =>
                                updateFilter(index, { value: event.target.value === "true" })
                              }
                            >
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                          ) : (
                            <input
                              className="input"
                              type={fieldType === "number" ? "number" : fieldType === "date" ? "date" : "text"}
                              value={typeof filter.value === "undefined" ? "" : String(filter.value)}
                              onChange={(event) =>
                                updateFilter(index, {
                                  value:
                                    fieldType === "number"
                                      ? event.target.value === ""
                                        ? undefined
                                        : Number(event.target.value)
                                      : event.target.value
                                })
                              }
                            />
                          )
                        ) : (
                          <input className="input" value="No value needed" disabled />
                        )}
                      </div>
                      <button className="button danger" type="button" onClick={() => removeFilter(index)}>
                        Remove
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="stack">
              <div className="section-title">
                <h3>Visible columns</h3>
              </div>
              <div className="columns-grid">
                {availableColumns.map((column) => {
                  const checked = activeColumns.includes(column);
                  const disabled = REQUIRED_COLUMNS.includes(column);

                  return (
                    <label key={column} className="checkbox">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleColumn(column)}
                      />
                      <span>{column}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="stack">
              <div className="section-title">
                <h3>Preview</h3>
                <span className="badge">
                  {previewLoading ? "Refreshing…" : `${preview.total} matching notes`}
                </span>
              </div>
              {previewError ? <div className="error">{previewError}</div> : null}
              <div className="table-wrap">
                {loading ? (
                  <div className="empty">Loading workspace…</div>
                ) : preview.rows.length === 0 ? (
                  <div className="empty">No notes match the current dashboard.</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        {activeColumns.map((column) => (
                          <th key={column}>{column}</th>
                        ))}
                        <th>Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row) => (
                        <tr key={row.path}>
                          {activeColumns.map((column) => (
                            <td key={`${row.path}-${column}`}>
                              {column === "title"
                                ? row.title
                                : column === "path"
                                  ? row.path
                                  : column === "modifiedAt"
                                    ? formatTimestamp(row.modifiedAt)
                                    : formatValue(row.fields[column])}
                            </td>
                          ))}
                          <td>
                            <a className="link" href={row.obsidianUrl}>
                              Open in Obsidian
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
