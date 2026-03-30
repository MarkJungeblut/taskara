import type { ScanWarning } from "@backend/domain/models/ScanWarning";

export interface VaultStatus {
  vaultPath: string;
  vaultName: string;
  noteCount: number;
  fieldCount: number;
  warningCount: number;
  warnings: ScanWarning[];
  scannedAt: string | null;
  dashboardsPath: string;
  revision: number;
  isReady: boolean;
  isScanning: boolean;
  lastError: string | null;
}
