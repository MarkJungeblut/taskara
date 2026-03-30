import chokidar, { type FSWatcher } from "chokidar";

import { VaultWorkspaceService } from "@backend/services/VaultWorkspaceService";
import { FileSystemDashboardRepository } from "@backend/repositories/FileSystemDashboardRepository";
import {
  getDashboardDirectoryPath,
  getVaultName,
  getVaultPath,
  shouldUsePolling
} from "@backend/infrastructure/vault/models/VaultConfig";
import { DefaultObsidianUrlBuilder } from "@backend/infrastructure/obsidian/DefaultObsidianUrlBuilder";
import { FileSystemVaultScanner } from "@backend/infrastructure/vault/FileSystemVaultScanner";

class RuntimeVaultWorkspace {
  readonly service: VaultWorkspaceService;
  private watcher: FSWatcher | null = null;
  private scheduledRefresh: NodeJS.Timeout | null = null;

  constructor() {
    this.service = new VaultWorkspaceService({
      dashboardRepository: new FileSystemDashboardRepository(),
      vaultScanner: new FileSystemVaultScanner(),
      obsidianUrlBuilder: new DefaultObsidianUrlBuilder(),
      getVaultPath,
      getVaultName,
      getDashboardDirectoryPath
    });
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
      void this.service.refreshAll();
    }, 250);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __taskaraRuntimeVaultWorkspace: RuntimeVaultWorkspace | undefined;
}

export function getVaultWorkspaceService(): VaultWorkspaceService {
  if (!global.__taskaraRuntimeVaultWorkspace) {
    global.__taskaraRuntimeVaultWorkspace = new RuntimeVaultWorkspace();
  }

  return global.__taskaraRuntimeVaultWorkspace.service;
}
