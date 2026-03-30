import { NextResponse } from "next/server";

import { parseQueryPreviewRequest } from "@backend/dto/parseQueryPreviewRequest";
import { getVaultWorkspaceService } from "@backend/infrastructure/vault/RuntimeVaultWorkspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const service = getVaultWorkspaceService();
  await service.ready();
  const payload = parseQueryPreviewRequest(await request.json());
  return NextResponse.json(service.preview(payload));
}
