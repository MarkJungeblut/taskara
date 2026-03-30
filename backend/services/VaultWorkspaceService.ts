import type { DashboardPayload } from "@backend/dto/DashboardPayload";
import type { QueryPreviewRequest } from "@backend/dto/QueryPreviewRequest";
import type { QueryPreviewResponse } from "@backend/dto/QueryPreviewResponse";
import type { DashboardRepository } from "@backend/repositories/DashboardRepository";
import { buildPreview } from "@backend/services/buildPreview";
import type { DashboardFile, FieldMetadata, NoteRecord, ScanWarning, VaultStatus } from "@backend/domain/models";
import type { ObsidianUrlBuilder } from "@backend/infrastructure/obsidian/ObsidianUrlBuilder";
import type { VaultScanner } from "@backend/infrastructure/vault/VaultScanner";

interface VaultWorkspaceServiceDependencies {
  dashboardRepository: DashboardRepository;
  vaultScanner: VaultScanner;
  obsidianUrlBuilder: ObsidianUrlBuilder;
  getVaultPath: () => string;
  getVaultName: () => string;
  getDashboardDirectoryPath: () => string;
}

export class VaultWorkspaceService {
  private readonly dashboardRepository: DashboardRepository;
  private readonly vaultScanner: VaultScanner;
  private readonly obsidianUrlBuilder: ObsidianUrlBuilder;
  private readonly getVaultPath: () => string;
  private readonly getVaultName: () => string;
  private readonly getDashboardDirectoryPath: () => string;

  private dashboards: DashboardFile[] = [];
  private fields: FieldMetadata[] = [];
  private notes: NoteRecord[] = [];
  private warnings: ScanWarning[] = [];
  private scannedAt: string | null = null;
  private revision = 0;
  private isReady = false;
  private isScanning = false;
  private lastError: string | null = null;
  private initialLoadPromise: Promise<void>;

  constructor(dependencies: VaultWorkspaceServiceDependencies) {
    this.dashboardRepository = dependencies.dashboardRepository;
    this.vaultScanner = dependencies.vaultScanner;
    this.obsidianUrlBuilder = dependencies.obsidianUrlBuilder;
    this.getVaultPath = dependencies.getVaultPath;
    this.getVaultName = dependencies.getVaultName;
    this.getDashboardDirectoryPath = dependencies.getDashboardDirectoryPath;
    this.initialLoadPromise = this.refreshAll();
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
      const [snapshot, dashboards] = await Promise.all([
        this.vaultScanner.scan(this.getVaultPath()),
        this.dashboardRepository.list()
      ]);
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
      vaultPath: this.getVaultPath(),
      vaultName: this.getVaultName(),
      noteCount: this.notes.length,
      fieldCount: this.fields.length,
      warningCount: this.warnings.length,
      warnings: this.warnings,
      scannedAt: this.scannedAt,
      dashboardsPath: this.getDashboardDirectoryPath(),
      revision: this.revision,
      isReady: this.isReady,
      isScanning: this.isScanning,
      lastError: this.lastError
    };
  }

  getFields(): FieldMetadata[] {
    return this.fields;
  }

  getDashboards(): DashboardFile[] {
    return this.dashboards;
  }

  async getDashboard(slug: string): Promise<DashboardFile | null> {
    return this.dashboardRepository.get(slug);
  }

  preview(request: QueryPreviewRequest): QueryPreviewResponse {
    return buildPreview(this.notes, request, (notePath) => this.obsidianUrlBuilder.build(notePath), this.fields);
  }

  async saveDashboard(payload: DashboardPayload, options?: { replace?: boolean }): Promise<DashboardFile> {
    const dashboard = await this.dashboardRepository.save(payload, options);
    this.dashboards = await this.dashboardRepository.list();
    this.revision += 1;
    return dashboard;
  }

  async deleteDashboard(slug: string): Promise<boolean> {
    const deleted = await this.dashboardRepository.delete(slug);

    if (deleted) {
      this.dashboards = await this.dashboardRepository.list();
      this.revision += 1;
    }

    return deleted;
  }
}
