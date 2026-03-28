import { NextResponse } from "next/server";

import { getVaultStore } from "@/lib/vault-store";
import type { DashboardPayload } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const store = getVaultStore();
  await store.ready();

  const dashboard = await store.getDashboard(slug);

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
  const store = getVaultStore();
  await store.ready();
  const payload = (await request.json()) as DashboardPayload;

  if (typeof payload.name !== "string" || payload.name.trim().length === 0) {
    return new NextResponse("Dashboard name is required.", { status: 400 });
  }

  const saved = await store.saveDashboard({
    ...payload,
    slug
  });
  return NextResponse.json(saved);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const store = getVaultStore();
  await store.ready();
  const deleted = await store.deleteDashboard(slug);

  if (!deleted) {
    return new NextResponse("Dashboard not found.", { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
