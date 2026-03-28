import { getVaultName } from "@/lib/config";

export function buildObsidianUrl(notePath: string): string {
  const vault = encodeURIComponent(getVaultName());
  const file = encodeURIComponent(notePath);
  return `obsidian://open?vault=${vault}&file=${file}`;
}
