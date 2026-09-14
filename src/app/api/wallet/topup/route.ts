/**
 * Wallet top-up initiation. Server-side auth + tenant check; creates a
 * payment row with purpose=wallet_topup and redirects to the gateway
 * (mock in dev, ZarinPal/YekPay when configured).
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/domains/auth/server";
import { startPayment } from "@/domains/payments/index";
import { requireMyBusiness } from "@/domains/dashboard/data";
import { ipRateLimit } from "@/domains/auth/security";

const schema = z.object({
  businessId: z.string().uuid(),
  amount: z.number().int().min(100_000).max(500_000_000),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "topup", 10, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const membership = await requireMyBusiness(session.user.id, body.data.businessId);
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const result = await startPayment({
    businessId: membership.business.id,
    purpose: "wallet_topup",
    amount: body.data.amount,
    description: "Foryxo service credit top-up",
    email: session.user.email,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "payment_provider_unavailable" ? 503 : 502 });
  return NextResponse.json({ ok: true, redirectUrl: result.redirectUrl, paymentId: result.paymentId });
}
