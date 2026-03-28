import chokidar, { type FSWatcher } from "chokidar";

import { getDashboardDirectoryPath, getVaultName, getVaultPath, shouldUsePolling } from "@/lib/config";
import { deleteDashboardFile, getDashboardFile, listDashboardFiles, saveDashboardFile } from "@/lib/dashboard-files";
import { buildObsidianUrl } from "@/lib/obsidian";
import { buildPreview } from "@/lib/query";
import { scanVault } from "@/lib/vault-scan";
import type {
  DashboardFile,
  DashboardPayload,
  QueryPreviewRequest,
  QueryPreviewResponse,
  VaultStatus
} from "@/lib/types";

class VaultStore {
  private dashboards: DashboardFile[] = [];
  private fields = [] as Awaited<ReturnType<typeof scanVault>>["fields"];
  private notes = [] as Awaited<ReturnType<typeof scanVault>>["notes"];
  private warnings = [] as Awaited<ReturnType<typeof scanVault>>["warnings"];
  private scannedAt: string | null = null;
  private revision = 0;
  private isReady = false;
  private isScanning = false;
  private lastError: string | null = null;
  private watcher: FSWatcher | null = null;
  private initialLoadPromise: Promise<void>;
  private scheduledRefresh: NodeJS.Timeout | null = null;

  constructor() {
    this.initialLoadPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.refreshAll();
    this.setupWatcher();
  }

  private setupWatcher(): void {
    if (this.watcher) {
      return;
    }

    this.watcher = chokidar.watch(getVaultPath(), {
      ignoreInitial: true,
      persistent: true,
      usePolling: shouldUsePolling(),
      interval: 500,
      ignored: (watchPath) => watchPath.includes("/node_modules/")
    });

    const schedule = () => this.scheduleRefresh();

    this.watcher
      .on("add", schedule)
      .on("change", schedule)
      .on("unlink", schedule)
      .on("addDir", schedule)
      .on("unlinkDir", schedule);
  }

  private scheduleRefresh(): void {
    if (this.scheduledRefresh) {
      clearTimeout(this.scheduledRefresh);
    }

    this.scheduledRefresh = setTimeout(() => {
      void this.refreshAll();
    }, 250);
  }

  async ready(): Promise<void> {
    await this.initialLoadPromise;
  }

  async refreshAll(): Promise<void> {
    if (this.isScanning) {
      return;
    }

    this.isScanning = true;
    this.lastError = null;

    try {
      const [snapshot, dashboards] = await Promise.all([scanVault(getVaultPath()), listDashboardFiles()]);
      this.notes = snapshot.notes;
      this.fields = snapshot.fields;
      this.warnings = snapshot.warnings;
      this.scannedAt = snapshot.scannedAt;
      this.dashboards = dashboards;
      this.revision += 1;
      this.isReady = true;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "Unknown vault scan error.";
    } finally {
      this.isScanning = false;
    }
  }

  getStatus(): VaultStatus {
    return {
      vaultPath: getVaultPath(),
      vaultName: getVaultName(),
      noteCount: this.notes.length,
      fieldCount: this.fields.length,
      warningCount: this.warnings.length,
      warnings: this.warnings,
      scannedAt: this.scannedAt,
      dashboardsPath: getDashboardDirectoryPath(),
      revision: this.revision,
      isReady: this.isReady,
      isScanning: this.isScanning,
      lastError: this.lastError
    };
  }

  getFields() {
    return this.fields;
  }

  getDashboards() {
    return this.dashboards;
  }

  async getDashboard(slug: string) {
    return getDashboardFile(slug);
  }

  preview(request: QueryPreviewRequest): QueryPreviewResponse {
    return buildPreview(this.notes, request, buildObsidianUrl, this.fields);
  }

  async saveDashboard(payload: DashboardPayload): Promise<DashboardFile> {
    const dashboard = await saveDashboardFile(payload);
    this.dashboards = await listDashboardFiles();
    this.revision += 1;
    return dashboard;
  }

  async deleteDashboard(slug: string): Promise<boolean> {
    const deleted = await deleteDashboardFile(slug);

    if (deleted) {
      this.dashboards = await listDashboardFiles();
      this.revision += 1;
    }

    return deleted;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __taskaraVaultStore: VaultStore | undefined;
}

export function getVaultStore(): VaultStore {
  if (!global.__taskaraVaultStore) {
    global.__taskaraVaultStore = new VaultStore();
  }

  return global.__taskaraVaultStore;
}
