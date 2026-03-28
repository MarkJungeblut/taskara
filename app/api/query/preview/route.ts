import { NextResponse } from "next/server";

import { getVaultStore } from "@/lib/vault-store";
import type { QueryPreviewRequest } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const store = getVaultStore();
  await store.ready();
  const payload = (await request.json()) as QueryPreviewRequest;
  return NextResponse.json(store.preview(payload));
}
