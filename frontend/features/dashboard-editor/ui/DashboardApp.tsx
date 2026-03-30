"use client";

import { useState } from "react";

import type { DashboardPayload } from "@backend/dto/DashboardPayload";
import type { DashboardFilter, FilterOperator } from "@backend/domain/models";
import { useDashboardFileActions } from "@frontend/features/dashboard-files/controller/useDashboardFileActions";
import {
  createEmptyDashboard,
  ensureColumns,
  REQUIRED_COLUMNS
} from "@frontend/features/dashboard-editor/model/dashboardDraft";
import {
  getOperatorOptions,
  needsValue
} from "@frontend/features/dashboard-editor/model/filterHelpers";
import { useQueryPreview } from "@frontend/features/query-preview/controller/useQueryPreview";
import { useWorkspace } from "@frontend/features/workspace/controller/useWorkspace";
import { OPERATOR_LABELS } from "@frontend/shared/domain/OperatorLabels";
import { formatTimestamp, formatValue } from "@frontend/shared/utils/format";

export function DashboardApp() {
  const { status, fields, dashboards, loading, error: workspaceError, setDashboards, rescanVault } = useWorkspace();
  const { saving, saveDashboard: persistDashboard, deleteDashboard: removeDashboard, listDashboards } =
    useDashboardFileActions();
  const [draft, setDraft] = useState<DashboardPayload>(createEmptyDashboard);
  const [error, setError] = useState<string | null>(null);
  const { preview, previewLoading, previewError } = useQueryPreview(draft);

  const availableColumns = Array.from(
    new Set(["title", "path", "modifiedAt", ...fields.map((field) => field.field)])
  );

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

    setError(null);

    try {
      const saved = await persistDashboard(draft);
      const nextDashboards = await listDashboards();
      setDashboards(nextDashboards);
      setDraft(saved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the dashboard.");
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
      await removeDashboard(draft.slug);
      const nextDashboards = await listDashboards();
      setDashboards(nextDashboards);
      setDraft(createEmptyDashboard());
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unable to delete the dashboard."
      );
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

        {workspaceError || error ? <div className="error">{workspaceError ?? error}</div> : null}

        <section className="workspace">
          <aside className="panel sidebar">
            <div className="stack">
              <div className="section-title">
                <h2>Vault status</h2>
                <span className="badge">{status?.isScanning ? "Scanning..." : "Watching"}</span>
              </div>
              <div className="subtle">{status?.vaultPath ?? "Loading vault path..."}</div>
              <div className="subtle">Dashboards: {status?.dashboardsPath ?? "Loading..."}</div>
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
                  {saving ? "Saving..." : "Save dashboard"}
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
                  {previewLoading ? "Refreshing..." : `${preview.total} matching notes`}
                </span>
              </div>
              {previewError ? <div className="error">{previewError}</div> : null}
              <div className="table-wrap">
                {loading ? (
                  <div className="empty">Loading workspace...</div>
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
