import test from "node:test";
import assert from "node:assert/strict";

import { buildPreview } from "../backend/services/buildPreview";
import type { FieldMetadata } from "../backend/domain/models/FieldMetadata";
import type { NoteRecord } from "../backend/domain/models/NoteRecord";

const fields: FieldMetadata[] = [
  {
    field: "project",
    type: "string",
    observedTypes: ["string"],
    allowedOperators: ["exists", "not_exists", "equals", "not_equals", "contains"]
  },
  {
    field: "type",
    type: "string",
    observedTypes: ["string"],
    allowedOperators: ["exists", "not_exists", "equals", "not_equals", "contains"]
  },
  {
    field: "start-date",
    type: "date",
    observedTypes: ["date"],
    allowedOperators: [
      "exists",
      "not_exists",
      "equals",
      "not_equals",
      "greater_than",
      "greater_than_or_equal",
      "less_than",
      "less_than_or_equal"
    ]
  },
  {
    field: "attendees",
    type: "string_list",
    observedTypes: ["string_list"],
    allowedOperators: ["exists", "not_exists", "equals", "not_equals", "contains"]
  }
];

const notes: NoteRecord[] = [
  {
    absolutePath: "/vault/foo-kickoff.md",
    path: "meetings/foo-kickoff.md",
    title: "Foo Kickoff",
    modifiedAt: "2026-01-02T12:00:00.000Z",
    fields: {
      type: { type: "string", value: "meeting-minute" },
      project: { type: "string", value: "foo" },
      "start-date": { type: "date", value: "2026-01-02" },
      attendees: { type: "string_list", value: ["Mark", "Dana"] }
    }
  },
  {
    absolutePath: "/vault/bar-brief.md",
    path: "projects/bar-brief.md",
    title: "Bar Brief",
    modifiedAt: "2026-03-18T12:00:00.000Z",
    fields: {
      type: { type: "string", value: "project-brief" },
      project: { type: "string", value: "bar" },
      "start-date": { type: "date", value: "2026-03-18" },
      attendees: { type: "string_list", value: ["Alex"] }
    }
  }
];

test("buildPreview filters notes with AND conditions", () => {
  const preview = buildPreview(
    notes,
    {
      filters: [
        { field: "type", operator: "equals", value: "meeting-minute" },
        { field: "project", operator: "equals", value: "foo" },
        {
          field: "start-date",
          operator: "greater_than_or_equal",
          value: "2026-01-01"
        }
      ],
      columns: ["title", "project", "start-date", "path"]
    },
    (notePath) => `obsidian://open?file=${notePath}`,
    fields
  );

  assert.equal(preview.total, 1);
  assert.equal(preview.rows[0]?.title, "Foo Kickoff");
});

test("buildPreview supports contains for string lists", () => {
  const preview = buildPreview(
    notes,
    {
      filters: [{ field: "attendees", operator: "contains", value: "Dana" }],
      columns: ["title", "attendees"]
    },
    (notePath) => `obsidian://open?file=${notePath}`,
    fields
  );

  assert.equal(preview.total, 1);
  assert.deepEqual(preview.rows[0]?.fields.attendees, ["Mark", "Dana"]);
});
