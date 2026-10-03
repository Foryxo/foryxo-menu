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
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, payment.invoiceId)).limit(1);
  if (!invoice) return;
  const paidTotal = Math.min(invoice.total, Number(paid?.total ?? 0));
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
  locale?: "fa" | "en";
  /** Stable for a single payable balance; prevents duplicate gateway attempts. */
  idempotencyKey?: string;
}

function existingRedirectUrl(payment: typeof payments.$inferSelect): string | null {
  if (!payment.providerRef) return null;
  if (payment.provider === "zarinpal") {
    const base = env.ZARINPAL_SANDBOX
      ? "https://sandbox.zarinpal.com/pg/StartPay"
      : "https://payment.zarinpal.com/pg/StartPay";
    return `${base}/${payment.providerRef}`;
  }
  if (payment.provider === "mock" && !isProd) {
    return `${env.APP_URL}/mock-gateway?authority=${encodeURIComponent(payment.providerRef)}&amount=${payment.amount}&paymentId=${encodeURIComponent(payment.id)}`;
  }
  return null;
}

export async function startPayment(input: StartPaymentInput) {
  const provider = getPaymentProvider();
  if (!provider) return { ok: false as const, error: "payment_provider_unavailable" };
  const db = getDb();
  const idempotencyKey = input.idempotencyKey ?? `pay-${crypto.randomUUID()}`;
  const locale = input.locale === "en" ? "en" : "fa";
  const callbackUrl = `${env.APP_URL}/api/payments/callback?locale=${locale}`;

  let [payment] = await db
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
      callbackUrl,
    })
    .onConflictDoNothing({ target: payments.idempotencyKey })
    .returning();

  if (!payment) {
    const [existing] = await db.select().from(payments).where(eq(payments.idempotencyKey, idempotencyKey)).limit(1);
    if (!existing) return { ok: false as const, error: "payment_in_progress" };
    if (["initiated", "redirect_pending", "verifying"].includes(existing.status)) {
      const redirectUrl = existingRedirectUrl(existing);
      return redirectUrl
        ? { ok: true as const, paymentId: existing.id, redirectUrl }
        : { ok: false as const, error: "payment_in_progress" };
    }
    if (existing.status === "paid") return { ok: false as const, error: "already_paid" };
    const [reclaimed] = await db.update(payments).set({
      status: "initiated",
      provider: provider.name,
      providerRef: null,
      failureReason: null,
    }).where(and(eq(payments.id, existing.id), eq(payments.status, existing.status))).returning();
    if (!reclaimed) return { ok: false as const, error: "payment_in_progress" };
    payment = reclaimed;
  }

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
    callbackUrl: `${callbackUrl}&paymentId=${payment.id}`,
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
    if (result.status === "unknown") {
      await db
        .update(payments)
        .set({ status: "redirect_pending", failureReason: result.error ?? "verification_unknown" })
        .where(eq(payments.id, paymentId));
      await db.insert(paymentEvents).values({
        id: crypto.randomUUID(),
        paymentId,
        type: "verify_unknown",
        payload: { error: result.error },
      });
      return { ok: false, error: "verification_pending" };
    }
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
