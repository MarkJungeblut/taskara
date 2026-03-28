import path from "node:path";

export const DASHBOARD_DIRECTORY = ".taskara/dashboards";

export function getVaultPath(): string {
  const configuredPath = process.env.VAULT_PATH;

  if (configuredPath) {
    return path.resolve(configuredPath);
  }

  return path.resolve(process.cwd(), "example-vault");
}

export function getVaultName(): string {
  return path.basename(getVaultPath());
}

export function getDashboardDirectoryPath(): string {
  return path.join(getVaultPath(), DASHBOARD_DIRECTORY);
}

export function shouldUsePolling(): boolean {
  return process.env.WATCH_USE_POLLING !== "false";
}

export function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep);
}
