import type { VaultSnapshot } from "@backend/domain/models";

export interface VaultScanner {
  scan(vaultPath: string): Promise<VaultSnapshot>;
}
