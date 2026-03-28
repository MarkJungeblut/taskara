import { NextResponse } from "next/server";

import { getVaultStore } from "@/lib/vault-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const store = getVaultStore();
  await store.ready();
  await store.refreshAll();
  return NextResponse.json({ ok: true });
}
