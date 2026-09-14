/**
 * ZarinPal adapter — official REST API v4.
 * EXTERNAL_VERIFICATION_REQUIRED: requires ZARINPAL_MERCHANT_ID + a live
 * transaction to verify end-to-end. Sandbox mode is enabled by default.
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

const API_BASE = "https://api.zarinpal.com/pg/v4/payment";
const PAY_START = "https://payment.zarinpal.com/pg/StartPay";
const SANDBOX_API = "https://sandbox.zarinpal.com/pg/v4/payment";
const SANDBOX_START = "https://sandbox.zarinpal.com/pg/StartPay";

export class ZarinPalProvider implements PaymentProvider {
  readonly name = "zarinpal";
  readonly supportsRefund = false; // refund via panel/API requires contract; documented

  constructor(
    private merchantId: string,
    private sandbox: boolean,
  ) {}

  private get base() {
    return this.sandbox ? SANDBOX_API : API_BASE;
  }
  private get startPay() {
    return this.sandbox ? SANDBOX_START : PAY_START;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const res = await fetch(`${this.base}/request.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          merchant_id: this.merchantId,
          amount: input.amount, // Toman per ZarinPal v4
          callback_url: input.callbackUrl,
          description: input.description,
          metadata: { mobile: input.mobile, email: input.email },
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const json = (await res.json()) as {
        data?: { authority?: string; code?: number };
        errors?: unknown;
      };
      const authority = json.data?.authority;
      const code = json.data?.code;
      if (authority && code === 100) {
        return { ok: true, providerRef: authority, redirectUrl: `${this.startPay}/${authority}` };
      }
      return { ok: false, error: `zarinpal_code_${code ?? "unknown"}` };
    } catch (e) {
      return { ok: false, error: `zarinpal_network: ${String(e)}` };
    }
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    try {
      const res = await fetch(`${this.base}/verify.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          merchant_id: this.merchantId,
          amount: input.amount,
          authority: input.providerRef,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const json = (await res.json()) as {
        data?: { code?: number; ref_id?: number; card_pan?: string };
      };
      const code = json.data?.code;
      if (code === 100 || code === 101) {
        return {
          ok: true,
          status: "paid",
          refId: json.data?.ref_id?.toString(),
          cardPan: json.data?.card_pan,
        };
      }
      return { ok: false, status: "failed", error: `zarinpal_verify_${code ?? "unknown"}` };
    } catch (e) {
      return { ok: false, status: "unknown", error: String(e) };
    }
  }

  async queryPayment(providerRef: string): Promise<VerifyPaymentResult> {
    void providerRef;
    // v4 has no public query endpoint; verify with stored amount is our source of truth.
    return { ok: false, status: "unknown", error: "query_unsupported_use_verify" };
  }

  async refundPayment(input: RefundInput): Promise<RefundResult> {
    void input;
    return { ok: false, status: "unsupported", error: "zarinpal_refund_requires_panel" };
  }
}
