/**
 * Admin refund decision (spec §31, §51).
 * Approve: debit ledger (idempotent), mark provider_submitted/completed by provider capability.
 * Reject: requires reason (server-enforced), audited.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/domains/auth/server";
import { getDb } from "@/domains/db/client";
import { refunds, creditAccounts, payments } from "@/domains/db/schema/index";
import { eq } from "drizzle-orm";
import { creditService } from "@/domains/wallet/ledger";
import { getPaymentProviderByName } from "@/domains/payments/index";
import { audit } from "@/domains/audit/log";
import { ipRateLimit } from "@/domains/auth/security";

const schema = z.object({
  refundId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "admin-refund", 30, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  // Step-up: only superadmin/admin/finance may decide refunds.
  if (!["superadmin", "admin", "finance"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  if (body.data.action === "reject" && (!body.data.reason || body.data.reason.trim().length < 3)) {
    return NextResponse.json({ error: "reason_required" }, { status: 422 });
  }

  const db = getDb();
  const [refund] = await db.select().from(refunds).where(eq(refunds.id, body.data.refundId)).limit(1);
  if (!refund) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!["requested", "reviewing"].includes(refund.status)) {
    return NextResponse.json({ error: "not_decidable" }, { status: 422 });
  }

  if (body.data.action === "reject") {
    await db
      .update(refunds)
      .set({ status: "rejected", rejectionReason: body.data.reason, reviewedBy: session.user.id, reviewedAt: new Date() })
      .where(eq(refunds.id, refund.id));
    await audit.log({
      actorUserId: session.user.id,
      actorRole: role,
      action: "refund.reject",
      targetType: "refund",
      targetId: refund.id,
      businessId: refund.businessId,
      next: { reason: body.data.reason },
    });
    return NextResponse.json({ ok: true });
  }

  // Approve: verify eligible balance still exists, then debit ledger.
  const [account] = await db
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.businessId, refund.businessId))
    .limit(1);
  const refundableBalance = account ? await creditService.getRefundableBalance(account.id) : 0;
  if (refundableBalance < refund.amount) {
    return NextResponse.json({ error: "insufficient_refundable_credit" }, { status: 422 });
  }

  await creditService.postEntry({
    accountId: account.id,
    amount: refund.amount,
    direction: "debit",
    category: "refund",
    referenceType: "refund",
    referenceId: refund.id,
    description: "Approved refund debit",
    createdBy: session.user.id,
    idempotencyKey: `refund-debit-${refund.id}`,
  });

  // Attempt provider refund when the original payment supports it.
  let finalStatus = "processing";
  if (refund.paymentId) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, refund.paymentId))
      .limit(1);
    const provider = payment ? getPaymentProviderByName(payment.provider) : null;
    if (payment?.providerRef && provider) {
      const result = await provider.refundPayment({
        providerRef: payment.providerRef,
        amount: refund.amount,
        idempotencyKey: `refund-${refund.id}`,
      });
      if (result.ok) {
        finalStatus = result.status === "completed" ? "completed" : "provider_submitted";
      } else if (result.status === "unsupported") {
        finalStatus = "processing"; // manual route via provider panel / bank
      } else {
        finalStatus = "failed";
      }
    }
  }

  // Restore the wallet debit if the gateway rejected the refund submission.
  if (finalStatus === "failed") {
    await creditService.postEntry({
      accountId: account.id,
      amount: refund.amount,
      direction: "credit",
      category: "adjustment",
      referenceType: "refund_compensation",
      referenceId: refund.id,
      description: "Compensation for failed refund submission",
      createdBy: "system",
      idempotencyKey: `refund-compensate-${refund.id}`,
    });
  }

  await db
    .update(refunds)
    .set({ status: finalStatus, reviewedBy: session.user.id, reviewedAt: new Date() })
    .where(eq(refunds.id, refund.id));

  await audit.log({
    actorUserId: session.user.id,
    actorRole: role,
    action: "refund.approve",
    targetType: "refund",
    targetId: refund.id,
    businessId: refund.businessId,
    next: { amount: refund.amount, status: finalStatus },
  });

  return NextResponse.json({ ok: true, status: finalStatus });
}
