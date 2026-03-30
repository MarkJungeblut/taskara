export function formatValue(value: string | number | boolean | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return typeof value === "undefined" ? "" : String(value);
}

export function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Not scanned yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
