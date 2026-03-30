import test from "node:test";
import assert from "node:assert/strict";

import type { QueryResultRow } from "../src/dto/QueryResultRow";
import { buildChartBuckets, CHART_EMPTY_LABEL } from "../src/domain/services/buildChartBuckets";

function row(overrides: Partial<QueryResultRow> & Pick<QueryResultRow, "path">): QueryResultRow {
  return {
    title: "t",
    path: overrides.path,
    modifiedAt: "2026-01-01",
    obsidianUrl: "obsidian://",
    fields: {},
    ...overrides
  };
}

test("buildChartBuckets groups string values and sorts by count desc", () => {
  const rows: QueryResultRow[] = [
    row({ path: "a", fields: { type: "meet" } }),
    row({ path: "b", fields: { type: "meet" } }),
    row({ path: "c", fields: { type: "doc" } })
  ];

  const buckets = buildChartBuckets(rows, "type");
  assert.deepEqual(
    buckets.map((b) => [b.label, b.count]),
    [
      ["meet", 2],
      ["doc", 1]
    ]
  );
});

test("buildChartBuckets uses empty bucket for missing field", () => {
  const rows: QueryResultRow[] = [
    row({ path: "a", fields: { type: "meet" } }),
    row({ path: "b", fields: {} })
  ];

  const buckets = buildChartBuckets(rows, "type");
  assert.equal(buckets.find((b) => b.label === CHART_EMPTY_LABEL)?.count, 1);
  assert.equal(buckets.find((b) => b.label === "meet")?.count, 1);
});

test("buildChartBuckets handles boolean and number", () => {
  const rows: QueryResultRow[] = [
    row({ path: "a", fields: { ok: true } }),
    row({ path: "b", fields: { ok: false } }),
    row({ path: "c", fields: { ok: true } }),
    row({ path: "d", fields: { n: 3 } })
  ];

  const boolBuckets = buildChartBuckets(rows, "ok");
  assert.deepEqual(
    new Map(boolBuckets.map((b) => [b.label, b.count])),
    new Map([
      ["true", 2],
      ["false", 1],
      [CHART_EMPTY_LABEL, 1]
    ])
  );

  const numBuckets = buildChartBuckets([row({ path: "x", fields: { count: 1 } })], "count");
  assert.deepEqual(numBuckets, [{ label: "1", count: 1 }]);
});

test("buildChartBuckets uses date string as category", () => {
  const rows: QueryResultRow[] = [
    row({ path: "a", fields: { start: "2026-01-02" } }),
    row({ path: "b", fields: { start: "2026-01-02" } })
  ];
  assert.deepEqual(buildChartBuckets(rows, "start"), [{ label: "2026-01-02", count: 2 }]);
});

test("buildChartBuckets explodes string_list across buckets", () => {
  const rows: QueryResultRow[] = [
    row({ path: "a", fields: { tags: ["x", "y"] } }),
    row({ path: "b", fields: { tags: ["x"] } })
  ];

  const buckets = buildChartBuckets(rows, "tags");
  assert.deepEqual(
    new Map(buckets.map((b) => [b.label, b.count])),
    new Map([
      ["x", 2],
      ["y", 1]
    ])
  );
});

test("buildChartBuckets treats empty list as empty bucket", () => {
  const rows: QueryResultRow[] = [row({ path: "a", fields: { tags: [] } })];
  assert.deepEqual(buildChartBuckets(rows, "tags"), [{ label: CHART_EMPTY_LABEL, count: 1 }]);
});
