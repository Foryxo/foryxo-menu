/**
 * Mock payment provider — development & CI only.
 * Simulates the full gateway lifecycle: start → redirect → verify (success/fail)
 * without any external calls. Enabled via FEATURE_FLAGS=mockPayments.
 */
import type {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
  RefundInput,
  RefundResult,
} from "./types";
import { createHash } from "node:crypto";

const g = globalThis as unknown as { foryxoMockAuth?: Map<string, string> };

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";
  readonly supportsRefund = true;

  private get store(): Map<string, string> {
    if (!g.foryxoMockAuth) g.foryxoMockAuth = new Map();
    return g.foryxoMockAuth;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const authority = `MOCK-${createHash("sha1").update(input.idempotencyKey).digest("hex").slice(0, 16)}`;
    this.store.set(authority, String(input.amount));
    // Mock gateway page simulates user approval.
    const url = `/mock-gateway?authority=${authority}&amount=${input.amount}`;
    return { ok: true, providerRef: authority, redirectUrl: url };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const stored = this.store.get(input.providerRef);
    const expectedAuthority = `MOCK-${createHash("sha1").update(input.idempotencyKey).digest("hex").slice(0, 16)}`;
    if (input.providerRef !== expectedAuthority) return { ok: false, status: "failed", error: "unknown_authority" };
    if (stored && stored !== String(input.amount)) {
      return { ok: false, status: "failed", error: "amount_mismatch" };
    }
    return { ok: true, status: "paid", refId: input.providerRef, cardPan: "6037********1234" };
  }

  async queryPayment(providerRef: string): Promise<VerifyPaymentResult> {
    const stored = this.store.get(providerRef);
    return stored
      ? { ok: true, status: "paid", refId: providerRef }
      : { ok: false, status: "unknown", error: "unknown_authority" };
  }

  async refundPayment(input: RefundInput): Promise<RefundResult> {
    void input;
    return { ok: true, status: "completed" };
  }
}
