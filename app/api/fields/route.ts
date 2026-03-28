import { NextResponse } from "next/server";

import { getVaultStore } from "@/lib/vault-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const store = getVaultStore();
  await store.ready();
  return NextResponse.json(store.getFields());
}
