import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  getDashboardFile,
  listDashboardFiles,
  saveDashboardFile
} from "../src/lib/dashboard-files";

async function createTempVault(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "taskara-vault-"));
}

test("dashboard files can be saved and listed", async () => {
  const vaultPath = await createTempVault();
  process.env.VAULT_PATH = vaultPath;

  const saved = await saveDashboardFile({
    version: 1,
    name: "Foo Meeting Minutes",
    filters: [{ field: "project", operator: "equals", value: "foo" }],
    columns: ["title", "path", "project"],
    sort: { field: "project", direction: "asc" }
  });

  assert.equal(saved.slug, "foo-meeting-minutes");

  const listed = await listDashboardFiles();
  assert.equal(listed.length, 1);
  assert.equal(listed[0]?.name, "Foo Meeting Minutes");

  const loaded = await getDashboardFile("foo-meeting-minutes");
  assert.equal(loaded?.filters[0]?.field, "project");
});
