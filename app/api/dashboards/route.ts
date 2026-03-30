import { NextResponse } from "next/server";

import { parseDashboardPayload } from "@backend/dto/parseDashboardPayload";
import { DashboardSlugConflictError } from "@backend/errors/DashboardSlugConflictError";
import { getVaultWorkspaceService } from "@backend/infrastructure/vault/RuntimeVaultWorkspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const service = getVaultWorkspaceService();
  await service.ready();
  return NextResponse.json(service.getDashboards());
}

export async function POST(request: Request) {
  const service = getVaultWorkspaceService();
  await service.ready();
  const payload = parseDashboardPayload(await request.json());
  if (!payload) {
    return new NextResponse("Dashboard name is required.", { status: 400 });
  }

  try {
    const saved = await service.saveDashboard(payload);
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof DashboardSlugConflictError) {
      return new NextResponse(error.message, { status: 409 });
    }
    throw error;
  }
}
