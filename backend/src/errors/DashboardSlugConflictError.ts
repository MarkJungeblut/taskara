export class DashboardSlugConflictError extends Error {
  readonly slug: string;
  readonly existingName: string;
  readonly requestedName: string;

  constructor(slug: string, existingName: string, requestedName: string) {
    super(
      `A dashboard with slug "${slug}" already exists as "${existingName}". Choose a different name, or edit the existing dashboard.`
    );
    this.name = "DashboardSlugConflictError";
    this.slug = slug;
    this.existingName = existingName;
    this.requestedName = requestedName;
  }
}
