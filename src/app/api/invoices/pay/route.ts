import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/domains/auth/server";
import { requireMyBusiness } from "@/domains/dashboard/data";
import { getDb } from "@/domains/db/client";
import { invoices } from "@/domains/db/schema/index";
import { eq } from "drizzle-orm";
import { startPayment } from "@/domains/payments/index";
import { ipRateLimit } from "@/domains/auth/security";

const schema = z.object({ businessId: z.string().uuid(), invoiceId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "invoice-pay", 10, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const membership = await requireMyBusiness(session.user.id, body.data.businessId);
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const db = getDb();
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, body.data.invoiceId)).limit(1);
  if (!inv || inv.businessId !== membership.business.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (inv.status === "paid" || inv.status === "void") {
    return NextResponse.json({ error: "not_payable" }, { status: 422 });
  }

  const remaining = inv.total - inv.paidTotal;
  const result = await startPayment({
    businessId: membership.business.id,
    invoiceId: inv.id,
    purpose: "invoice",
    amount: remaining,
    description: `Invoice ${inv.number}`,
    email: session.user.email,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "payment_provider_unavailable" ? 503 : 502 });
  return NextResponse.json({ ok: true, redirectUrl: result.redirectUrl });
}
