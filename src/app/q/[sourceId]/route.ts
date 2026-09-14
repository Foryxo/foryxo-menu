import { NextResponse } from "next/server";
import { resolveMenuQr } from "@/domains/qr/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await params;
  const fallback = new URL("/fa/status/menu-unavailable", request.url);
  if (!/^[a-f0-9]{36}$/.test(sourceId)) return NextResponse.redirect(fallback, 307);
  const resolved = await resolveMenuQr(sourceId);
  if (!resolved) return NextResponse.redirect(fallback, 307);
  return NextResponse.redirect(new URL(resolved.targetUrl, request.url), 307);
}
