import type { DashboardFile } from "@backend/domain/models";
import type { DashboardPayload } from "@backend/dto/DashboardPayload";

export interface DashboardRepository {
  list(): Promise<DashboardFile[]>;
  get(slug: string): Promise<DashboardFile | null>;
  save(payload: DashboardPayload, options?: { replace?: boolean }): Promise<DashboardFile>;
  delete(slug: string): Promise<boolean>;
}
