import type { DashboardDefinition } from "@backend/domain/models/DashboardDefinition";

export interface DashboardFile extends DashboardDefinition {
  slug: string;
  filePath: string;
  updatedAt: string;
}
