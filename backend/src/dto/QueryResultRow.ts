export interface QueryResultRow {
  title: string;
  path: string;
  modifiedAt: string;
  obsidianUrl: string;
  fields: Record<string, string | number | boolean | string[] | undefined>;
}
