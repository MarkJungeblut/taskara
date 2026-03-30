import { NextResponse } from "next/server";

import { getVaultWorkspaceService } from "@backend/infrastructure/vault/RuntimeVaultWorkspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const service = getVaultWorkspaceService();
  await service.ready();
  return NextResponse.json(service.getFields());
}
