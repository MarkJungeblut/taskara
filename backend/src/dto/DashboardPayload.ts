import type { DashboardDefinition } from "@backend/domain/models";

export interface DashboardPayload extends DashboardDefinition {
  slug?: string;
}
