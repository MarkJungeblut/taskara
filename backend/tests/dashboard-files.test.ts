import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { DashboardPayload } from "../src/dto/DashboardPayload";
import { FileSystemDashboardRepository } from "../src/repositories/FileSystemDashboardRepository";
import { DashboardSlugConflictError } from "../src/errors/DashboardSlugConflictError";

async function createTempVault(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "taskara-vault-"));
}

test("dashboard files can be saved and listed", async () => {
  const vaultPath = await createTempVault();
  process.env.VAULT_PATH = vaultPath;
  const repo = new FileSystemDashboardRepository();

  const saved = await repo.save({
    version: 1,
    name: "Foo Meeting Minutes",
    filters: [{ field: "project", operator: "equals", value: "foo" }],
    columns: ["title", "path", "project"],
    sort: { field: "project", direction: "asc" }
  });

  assert.equal(saved.slug, "foo-meeting-minutes");

  const listed = await repo.list();
  assert.equal(listed.length, 1);
  assert.equal(listed[0]?.name, "Foo Meeting Minutes");

  const loaded = await repo.get("foo-meeting-minutes");
  assert.equal(loaded?.filters[0]?.field, "project");
});

const minimalPayload: DashboardPayload = {
  version: 1 as const,
  name: "",
  filters: [],
  columns: ["title", "path"]
};

test("saveDashboardFile rejects slug collision when names differ and replace is false", async () => {
  const vaultPath = await createTempVault();
  process.env.VAULT_PATH = vaultPath;
  const repo = new FileSystemDashboardRepository();

  await repo.save({ ...minimalPayload, name: "Foo Bar" });

  await assert.rejects(
    repo.save({ ...minimalPayload, name: "Foo-Bar" }),
    (error: unknown) => {
      assert.ok(error instanceof DashboardSlugConflictError);
      const conflict = error as DashboardSlugConflictError;
      assert.equal(conflict.slug, "foo-bar");
      assert.equal(conflict.existingName, "Foo Bar");
      assert.equal(conflict.requestedName, "Foo-Bar");
      return true;
    }
  );
});

test("saveDashboardFile allows same slug when replace is true", async () => {
  const vaultPath = await createTempVault();
  process.env.VAULT_PATH = vaultPath;
  const repo = new FileSystemDashboardRepository();

  await repo.save({ ...minimalPayload, name: "Foo Bar" });

  const saved = await repo.save(
    { ...minimalPayload, name: "Foo-Bar" },
    { replace: true }
  );

  assert.equal(saved.slug, "foo-bar");
  assert.equal(saved.name, "Foo-Bar");

  const loaded = await repo.get("foo-bar");
  assert.equal(loaded?.name, "Foo-Bar");
});

test("saveDashboardFile allows idempotent save for same display name and slug", async () => {
  const vaultPath = await createTempVault();
  process.env.VAULT_PATH = vaultPath;
  const repo = new FileSystemDashboardRepository();

  await repo.save({ ...minimalPayload, name: "Foo Bar" });
  const again = await repo.save({ ...minimalPayload, name: "Foo Bar" });

  assert.equal(again.slug, "foo-bar");
  assert.equal(again.name, "Foo Bar");

  const listed = await repo.list();
  assert.equal(listed.length, 1);
});
