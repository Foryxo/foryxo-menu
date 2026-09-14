/**
 * Refund request (spec §90): user requests unused eligible credit.
 * Creates a refund row in `requested` state; admin review follows.
 * Promotional credit is excluded by category checks at approval time.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/domains/auth/server";
import { requireMyBusiness } from "@/domains/dashboard/data";
import { getDb } from "@/domains/db/client";
import { refunds, creditAccounts } from "@/domains/db/schema/index";
import { eq } from "drizzle-orm";
import { creditService, LedgerError } from "@/domains/wallet/ledger";
import { audit } from "@/domains/audit/log";
import { ipRateLimit } from "@/domains/auth/security";

const schema = z.object({
  businessId: z.string().uuid(),
  amount: z.number().int().min(100_000),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "refund-request", 5, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const membership = await requireMyBusiness(session.user.id, body.data.businessId);
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const db = getDb();
  const [account] = await db
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.businessId, membership.business.id))
    .limit(1);
  const refundableBalance = account ? await creditService.getRefundableBalance(account.id) : 0;
  if (body.data.amount > refundableBalance) {
    return NextResponse.json({ error: "insufficient_refundable_credit" }, { status: 422 });
  }

  const [refund] = await db
    .insert(refunds)
    .values({
      id: crypto.randomUUID(),
      businessId: membership.business.id,
      amount: body.data.amount,
      reason: body.data.reason ?? "user_request",
      status: "requested",
      requestedBy: session.user.id,
    })
    .returning();

  await audit.log({
    actorUserId: session.user.id,
    action: "refund.request",
    targetType: "refund",
    targetId: refund.id,
    businessId: membership.business.id,
    next: { amount: body.data.amount },
  });

  return NextResponse.json({ ok: true, refundId: refund.id });
}

export { LedgerError };
