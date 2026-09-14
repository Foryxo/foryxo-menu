/**
 * Payment provider abstraction (spec §30).
 * NEVER trust return-page query params — server-side verification required.
 */
export interface CreatePaymentInput {
  amount: number; // Toman
  currency: "IRT";
  description: string;
  callbackUrl: string; // our verified callback endpoint
  mobile?: string;
  email?: string;
  idempotencyKey: string;
}

export interface CreatePaymentResult {
  ok: boolean;
  redirectUrl?: string;
  providerRef?: string; // authority
  error?: string;
}

export interface VerifyPaymentInput {
  providerRef: string; // authority from gateway
  amount: number;
  idempotencyKey: string;
}

export interface VerifyPaymentResult {
  ok: boolean;
  status: "paid" | "failed" | "unknown";
  cardPan?: string;
  refId?: string;
  error?: string;
}

export interface RefundInput {
  providerRef: string;
  amount: number;
  idempotencyKey: string;
}

export interface RefundResult {
  ok: boolean;
  status: "submitted" | "completed" | "failed" | "unsupported";
  error?: string;
}

export interface PaymentProvider {
  readonly name: string;
  readonly supportsRefund: boolean;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
  queryPayment(providerRef: string): Promise<VerifyPaymentResult>;
  refundPayment(input: RefundInput): Promise<RefundResult>;
}
