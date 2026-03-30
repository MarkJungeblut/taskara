import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import type { DashboardPayload } from "@backend/dto/DashboardPayload";
import type { DashboardRepository } from "@backend/repositories/DashboardRepository";
import type { DashboardDefinition, DashboardFile, DashboardFilter, DashboardSort } from "@backend/domain/models";
import { normalizeDashboardCharts } from "@backend/domain/services/normalizeDashboardCharts";
import { getDashboardDirectoryPath } from "@backend/infrastructure/vault/models/VaultConfig";
import { DashboardSlugConflictError } from "@backend/errors/DashboardSlugConflictError";

function slugifyName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "dashboard"
  );
}

function normalizeColumns(columns: unknown): string[] {
  if (!Array.isArray(columns)) {
    return ["title", "path"];
  }

  const normalized = columns.filter((column): column is string => typeof column === "string");
  const unique = new Set(["title", "path", ...normalized]);

  return Array.from(unique);
}

function normalizeFilters(filters: unknown): DashboardFilter[] {
  if (!Array.isArray(filters)) {
    return [];
  }

  return filters.flatMap((filter) => {
    if (!filter || typeof filter !== "object") {
      return [];
    }

    const candidate = filter as Record<string, unknown>;

    if (typeof candidate.field !== "string" || typeof candidate.operator !== "string") {
      return [];
    }

    const normalized: DashboardFilter = {
      field: candidate.field,
      operator: candidate.operator as DashboardFilter["operator"]
    };

    if (
      typeof candidate.value === "string" ||
      typeof candidate.value === "number" ||
      typeof candidate.value === "boolean"
    ) {
      normalized.value = candidate.value;
    }

    return [normalized];
  });
}

function normalizeSort(sort: unknown): DashboardSort | undefined {
  if (!sort || typeof sort !== "object") {
    return undefined;
  }

  const candidate = sort as Record<string, unknown>;

  if (
    typeof candidate.field !== "string" ||
    (candidate.direction !== "asc" && candidate.direction !== "desc")
  ) {
    return undefined;
  }

  return {
    field: candidate.field,
    direction: candidate.direction
  };
}

function normalizeDashboardData(data: unknown): DashboardDefinition | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const candidate = data as Record<string, unknown>;

  if (typeof candidate.name !== "string" || candidate.name.trim().length === 0) {
    return null;
  }

  const charts = normalizeDashboardCharts(candidate.charts);

  return {
    version: 1,
    name: candidate.name.trim(),
    filters: normalizeFilters(candidate.filters),
    columns: normalizeColumns(candidate.columns),
    sort: normalizeSort(candidate.sort),
    ...(charts ? { charts } : {})
  };
}

async function ensureDashboardDirectory(): Promise<string> {
  const directoryPath = getDashboardDirectoryPath();
  await fs.mkdir(directoryPath, { recursive: true });
  return directoryPath;
}

export class FileSystemDashboardRepository implements DashboardRepository {
  async list(): Promise<DashboardFile[]> {
    const directoryPath = await ensureDashboardDirectory();
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    const dashboards: DashboardFile[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".yaml")) {
        continue;
      }

      const filePath = path.join(directoryPath, entry.name);
      try {
        const raw = await fs.readFile(filePath, "utf8");
        const normalized = normalizeDashboardData(parseYaml(raw));

        if (!normalized) {
          continue;
        }

        const stats = await fs.stat(filePath);

        dashboards.push({
          ...normalized,
          slug: path.basename(entry.name, ".yaml"),
          filePath,
          updatedAt: stats.mtime.toISOString()
        });
      } catch {
        continue;
      }
    }

    return dashboards.sort((left, right) => left.name.localeCompare(right.name));
  }

  async get(slug: string): Promise<DashboardFile | null> {
    const filePath = path.join(await ensureDashboardDirectory(), `${slug}.yaml`);

    try {
      const [raw, stats] = await Promise.all([fs.readFile(filePath, "utf8"), fs.stat(filePath)]);
      const normalized = normalizeDashboardData(parseYaml(raw));

      if (!normalized) {
        return null;
      }

      return {
        ...normalized,
        slug,
        filePath,
        updatedAt: stats.mtime.toISOString()
      };
    } catch {
      return null;
    }
  }

  async save(payload: DashboardPayload, options?: { replace?: boolean }): Promise<DashboardFile> {
    const directoryPath = await ensureDashboardDirectory();
    const slug = payload.slug ? slugifyName(payload.slug) : slugifyName(payload.name);

    if (!options?.replace) {
      const existing = await this.get(slug);
      if (existing && existing.name.trim() !== payload.name.trim()) {
        throw new DashboardSlugConflictError(slug, existing.name, payload.name.trim());
      }
    }

    const filePath = path.join(directoryPath, `${slug}.yaml`);

    const charts = normalizeDashboardCharts(payload.charts);

    const normalized: DashboardDefinition = {
      version: 1,
      name: payload.name.trim(),
      filters: normalizeFilters(payload.filters),
      columns: normalizeColumns(payload.columns),
      sort: normalizeSort(payload.sort),
      ...(charts ? { charts } : {})
    };

    await fs.writeFile(
      filePath,
      stringifyYaml({
        version: normalized.version,
        name: normalized.name,
        filters: normalized.filters,
        columns: normalized.columns,
        ...(normalized.sort ? { sort: normalized.sort } : {}),
        ...(normalized.charts?.length ? { charts: normalized.charts } : {})
      }),
      "utf8"
    );

    const stats = await fs.stat(filePath);

    return {
      ...normalized,
      slug,
      filePath,
      updatedAt: stats.mtime.toISOString()
    };
  }

  async delete(slug: string): Promise<boolean> {
    const filePath = path.join(await ensureDashboardDirectory(), `${slug}.yaml`);

    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
