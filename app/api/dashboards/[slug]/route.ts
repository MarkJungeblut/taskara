import { NextResponse } from "next/server";

import { parseDashboardPayload } from "@backend/dto/parseDashboardPayload";
import { getVaultWorkspaceService } from "@backend/infrastructure/vault/RuntimeVaultWorkspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const service = getVaultWorkspaceService();
  await service.ready();

  const dashboard = await service.getDashboard(slug);

  if (!dashboard) {
    return new NextResponse("Dashboard not found.", { status: 404 });
  }

  return NextResponse.json(dashboard);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const service = getVaultWorkspaceService();
  await service.ready();
  const payload = parseDashboardPayload(await request.json());

  if (!payload) {
    return new NextResponse("Dashboard name is required.", { status: 400 });
  }

  const saved = await service.saveDashboard(
    {
      ...payload,
      slug
    },
    { replace: true }
  );
  return NextResponse.json(saved);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const service = getVaultWorkspaceService();
  await service.ready();
  const deleted = await service.deleteDashboard(slug);

  if (!deleted) {
    return new NextResponse("Dashboard not found.", { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
