import { NextResponse } from "next/server";

import { getVaultStore } from "@/lib/vault-store";
import type { DashboardPayload } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const store = getVaultStore();
  await store.ready();
  return NextResponse.json(store.getDashboards());
}

export async function POST(request: Request) {
  const store = getVaultStore();
  await store.ready();

  const payload = (await request.json()) as DashboardPayload;

  if (typeof payload.name !== "string" || payload.name.trim().length === 0) {
    return new NextResponse("Dashboard name is required.", { status: 400 });
  }

  const saved = await store.saveDashboard(payload);
  return NextResponse.json(saved);
}
