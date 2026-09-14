import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("payment provider safety", () => {
  it("never falls back to mock payments in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FEATURE_FLAGS", "mockPayments");
    vi.stubEnv("ZARINPAL_MERCHANT_ID", "");
    vi.stubEnv("YEKPAY_APP_ID", "");
    vi.stubEnv("YEKPAY_APP_SECRET", "");
    vi.resetModules();
    const { getPaymentProvider, getPaymentProviderByName, startPayment } = await import("../../src/domains/payments/index");
    expect(getPaymentProvider()).toBeNull();
    expect(getPaymentProviderByName("mock")).toBeNull();
    await expect(startPayment({
      businessId: crypto.randomUUID(),
      purpose: "wallet_topup",
      amount: 100_000,
      description: "No gateway configured",
    })).resolves.toEqual({ ok: false, error: "payment_provider_unavailable" });
  }, 20_000);

  it("does not activate the incompatible YekPay adapter from legacy app credentials", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ZARINPAL_MERCHANT_ID", "");
    vi.stubEnv("YEKPAY_APP_ID", "legacy-id");
    vi.stubEnv("YEKPAY_APP_SECRET", "legacy-secret");
    vi.resetModules();
    const { getPaymentProvider, getPaymentProviderByName } = await import("../../src/domains/payments/index");
    expect(getPaymentProvider()).toBeNull();
    expect(getPaymentProviderByName("yekpay")).toBeNull();
  }, 20_000);
});
