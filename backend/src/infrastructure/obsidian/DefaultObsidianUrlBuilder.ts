import type { ObsidianUrlBuilder } from "@backend/infrastructure/obsidian/ObsidianUrlBuilder";
import { getVaultName } from "@backend/infrastructure/vault/models/VaultConfig";

export class DefaultObsidianUrlBuilder implements ObsidianUrlBuilder {
  build(notePath: string): string {
    const vault = encodeURIComponent(getVaultName());
    const file = encodeURIComponent(notePath);
    return `obsidian://open?vault=${vault}&file=${file}`;
  }
}
