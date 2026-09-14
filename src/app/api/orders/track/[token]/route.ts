import { NextResponse, type NextRequest } from "next/server";
import { ipRateLimit } from "@/domains/auth/security";
import { getPublicOrderTracking } from "@/domains/ordering/tracking";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "0.0.0.0";
  const limit = await ipRateLimit(ip, "order-tracking", 120, 900);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const { token } = await params;
  if (!/^[a-f0-9]{32,64}$/.test(token)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const order = await getPublicOrderTracking(token);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, order }, { headers: { "Cache-Control": "private, no-store" } });
}
