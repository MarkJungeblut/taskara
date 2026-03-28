import test from "node:test";
import assert from "node:assert/strict";

import { parseFrontmatterBlock } from "../src/lib/frontmatter";

test("parseFrontmatterBlock normalizes supported values", () => {
  const source = `---
type: meeting-minute
project: foo
priority: 3
published: true
start-date: 2026-01-01
attendees:
  - Mark
  - Dana
---

# Example`;

  const result = parseFrontmatterBlock(source, "notes/example.md");

  assert.equal(result.warnings.length, 0);
  assert.deepEqual(result.fields.type, { type: "string", value: "meeting-minute" });
  assert.deepEqual(result.fields.project, { type: "string", value: "foo" });
  assert.deepEqual(result.fields.priority, { type: "number", value: 3 });
  assert.deepEqual(result.fields.published, { type: "boolean", value: true });
  assert.deepEqual(result.fields["start-date"], { type: "date", value: "2026-01-01" });
  assert.deepEqual(result.fields.attendees, { type: "string_list", value: ["Mark", "Dana"] });
});

test("parseFrontmatterBlock reports unsupported nested values", () => {
  const source = `---
project:
  name: foo
---`;

  const result = parseFrontmatterBlock(source, "notes/example.md");

  assert.equal(Object.keys(result.fields).length, 0);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0]?.type, "unsupported_value");
});

test("parseFrontmatterBlock reports invalid yaml", () => {
  const source = `---
project: [
---`;

  const result = parseFrontmatterBlock(source, "notes/example.md");

  assert.equal(Object.keys(result.fields).length, 0);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0]?.type, "invalid_yaml");
});
