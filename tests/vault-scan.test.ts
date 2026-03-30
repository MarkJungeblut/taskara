import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { FileSystemVaultScanner } from "../backend/infrastructure/vault/FileSystemVaultScanner";

async function createTempVault(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "taskara-scan-"));
}

test("scanVault parses markdown notes and gathers warnings", async () => {
  const vaultPath = await createTempVault();
  await fs.mkdir(path.join(vaultPath, "notes"), { recursive: true });

  await fs.writeFile(
    path.join(vaultPath, "notes", "meeting.md"),
    `---
type: meeting-minute
project: foo
start-date: 2026-01-01
---

# Meeting
`,
    "utf8"
  );

  await fs.writeFile(
    path.join(vaultPath, "notes", "invalid.md"),
    `---
project: [
---
`,
    "utf8"
  );

  const snapshot = await new FileSystemVaultScanner().scan(vaultPath);

  assert.equal(snapshot.notes.length, 2);
  assert.equal(snapshot.fields.some((field) => field.field === "project"), true);
  assert.equal(snapshot.warnings.length, 1);
  assert.equal(snapshot.warnings[0]?.type, "invalid_yaml");
});
