/**
 * Payment orchestration (spec §51): initiate → redirect → callback → verify →
 * ledger credit → invoice update. Idempotent; replay-safe; fully audited.
 */
import { and, eq, sum } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import { payments, paymentEvents, invoices } from "@/domains/db/schema/index";
import { env, isProd, flags } from "@/config/env";
import { ZarinPalProvider } from "./zarinpal";
import { MockPaymentProvider } from "./mock";
import type { PaymentProvider } from "./types";
import { creditService } from "@/domains/wallet/ledger";
import { audit } from "@/domains/audit/log";

export function getPaymentProvider(): PaymentProvider | null {
  // Never create a mock payment in production, even if a stale flag is present.
  if (!isProd && flags.mockPayments) {
    return new MockPaymentProvider();
  }
  if (env.ZARINPAL_MERCHANT_ID && (!isProd || !env.ZARINPAL_SANDBOX)) {
    return new ZarinPalProvider(env.ZARINPAL_MERCHANT_ID, env.ZARINPAL_SANDBOX);
  }
  // YekPay's published WebGate API requires a merchant ID and complete payer
  // billing fields. The legacy APP_ID/APP_SECRET adapter is not compatible;
  // do not offer it until the merchant account and billing checkout are wired.
  return isProd ? null : new MockPaymentProvider();
}

/** Resolve the gateway recorded on a payment; never substitute a different provider. */
export function getPaymentProviderByName(name: string): PaymentProvider | null {
  if (name === "mock" && !isProd) return new MockPaymentProvider();
  if (name === "zarinpal" && env.ZARINPAL_MERCHANT_ID && (!isProd || !env.ZARINPAL_SANDBOX)) {
    return new ZarinPalProvider(env.ZARINPAL_MERCHANT_ID, env.ZARINPAL_SANDBOX);
  }
  return null;
}

async function fulfillPaidPayment(payment: typeof payments.$inferSelect) {
  const db = getDb();
  if (payment.purpose === "wallet_topup") {
    await creditService.topupFromPayment({
      businessId: payment.businessId,
      amount: payment.amount,
      paymentId: payment.id,
      provider: payment.provider,
    });
    return;
  }
  if (!payment.invoiceId) return;
  const [paid] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(and(eq(payments.invoiceId, payment.invoiceId), eq(payments.status, "paid")));
  const paidTotal = Number(paid?.total ?? 0);
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, payment.invoiceId)).limit(1);
  if (!invoice) return;
  await db
    .update(invoices)
    .set({ paidTotal, status: paidTotal >= invoice.total ? "paid" : "partially_paid" })
    .where(eq(invoices.id, invoice.id));
}

export interface StartPaymentInput {
  businessId: string;
  invoiceId?: string;
  purpose: "invoice" | "wallet_topup";
  amount: number;
  description: string;
  mobile?: string;
  email?: string;
}

export async function startPayment(input: StartPaymentInput) {
  const provider = getPaymentProvider();
  if (!provider) return { ok: false as const, error: "payment_provider_unavailable" };
  const db = getDb();
  const idempotencyKey = `pay-${crypto.randomUUID()}`;

  const [payment] = await db
    .insert(payments)
    .values({
      id: crypto.randomUUID(),
      businessId: input.businessId,
      invoiceId: input.invoiceId,
      provider: provider.name,
      amount: input.amount,
      purpose: input.purpose,
      status: "initiated",
      idempotencyKey,
      callbackUrl: `${env.APP_URL}/api/payments/callback`,
    })
    .returning();

  await db.insert(paymentEvents).values({
    id: crypto.randomUUID(),
    paymentId: payment.id,
    type: "created",
    payload: { provider: provider.name, amount: input.amount },
  });

  const result = await provider.createPayment({
    amount: input.amount,
    currency: "IRT",
    description: input.description,
    callbackUrl: `${env.APP_URL}/api/payments/callback?paymentId=${payment.id}`,
    mobile: input.mobile,
    email: input.email,
    idempotencyKey,
  });

  if (!result.ok) {
    await db
      .update(payments)
      .set({ status: "failed", failureReason: result.error })
      .where(eq(payments.id, payment.id));
    return { ok: false as const, error: result.error ?? "provider_error" };
  }

  await db
    .update(payments)
    .set({ status: "redirect_pending", providerRef: result.providerRef })
    .where(eq(payments.id, payment.id));
  await db.insert(paymentEvents).values({
    id: crypto.randomUUID(),
    paymentId: payment.id,
    type: "redirected",
    payload: { providerRef: result.providerRef },
  });

  const redirectUrl = result.redirectUrl?.startsWith("/mock-gateway")
    ? `${result.redirectUrl}&paymentId=${encodeURIComponent(payment.id)}`
    : result.redirectUrl!;
  return { ok: true as const, paymentId: payment.id, redirectUrl };
}

/**
 * Verify a payment on callback. Idempotent: duplicate callbacks are
 * detected and answered without double-crediting.
 */
export async function verifyPaymentCallback(
  paymentId: string,
  opts: { authority?: string; amountFromProvider?: number },
): Promise<{ ok: boolean; alreadyProcessed?: boolean; error?: string }> {
  const db = getDb();
  const payment = (await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1))[0];
  if (!payment) return { ok: false, error: "payment_not_found" };

  // Idempotency: already verified → answer success without re-crediting.
  if (payment.status === "paid" && payment.verifiedAt) {
    await fulfillPaidPayment(payment);
    await db.insert(paymentEvents).values({
      id: crypto.randomUUID(),
      paymentId,
      type: "duplicate_callback",
    });
    return { ok: true, alreadyProcessed: true };
  }
  if (payment.status === "failed" || payment.status === "cancelled") {
    return { ok: false, error: "payment_terminal_state" };
  }

  const provider = getPaymentProviderByName(payment.provider);
  if (!provider) return { ok: false, error: "payment_provider_unavailable" };
  // Never verify a different transaction against this payment's amount.
  if (opts.authority && opts.authority !== payment.providerRef) {
    return { ok: false, error: "authority_mismatch" };
  }
  const authority = opts.authority ?? payment.providerRef;
  if (!authority) return { ok: false, error: "missing_authority" };

  await db.update(payments).set({ status: "verifying" }).where(eq(payments.id, paymentId));

  const result = await provider.verifyPayment({
    providerRef: authority,
    amount: payment.amount,
    idempotencyKey: payment.idempotencyKey,
  });

  if (!result.ok || result.status !== "paid") {
    await db
      .update(payments)
      .set({ status: "failed", failureReason: result.error ?? "verify_failed" })
      .where(eq(payments.id, paymentId));
    await db.insert(paymentEvents).values({
      id: crypto.randomUUID(),
      paymentId,
      type: "verify_failed",
      payload: { error: result.error },
    });
    return { ok: false, error: result.error ?? "verify_failed" };
  }

  const verifiedAt = new Date();
  await db
    .update(payments)
    .set({ status: "paid", verifiedAt, meta: { refId: result.refId, cardPan: result.cardPan } })
    .where(eq(payments.id, paymentId));
  await db.insert(paymentEvents).values({
    id: crypto.randomUUID(),
    paymentId,
    type: "verify_ok",
    payload: { refId: result.refId },
  });

  await fulfillPaidPayment({ ...payment, status: "paid", verifiedAt });

  await audit.log({
    action: "payment.verified",
    targetType: "payment",
    targetId: payment.id,
    businessId: payment.businessId,
    next: { amount: payment.amount, provider: payment.provider, refId: result.refId },
  });

  return { ok: true };
}
