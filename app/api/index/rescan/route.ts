import { NextResponse } from "next/server";

import { getVaultWorkspaceService } from "@backend/infrastructure/vault/RuntimeVaultWorkspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const service = getVaultWorkspaceService();
  await service.ready();
  await service.refreshAll();
  return NextResponse.json({ ok: true });
}
