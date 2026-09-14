import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("OTP delivery readiness", () => {
  it("preserves a failed sender result through an async auth request", async () => {
    const { captureEmailOtpDelivery, recordEmailOtpDeliveryFailure } = await import("../../src/domains/auth/email-delivery-status");
    const result = await captureEmailOtpDelivery(async () => {
      await Promise.resolve();
      recordEmailOtpDeliveryFailure(new Error("RATE_LIMITED"));
      return { success: true };
    });
    expect(result).toEqual({ result: { success: true }, failure: "rate_limited" });
  });

  it("never advertises console-only email or SMS in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_DEV_OTP", "true");
    vi.stubEnv("EMAIL_PROVIDER", "console");
    vi.stubEnv("SMS_PROVIDER", "console");
    vi.resetModules();
    const { flags } = await import("../../src/config/env");
    expect(flags.emailOtp).toBe(false);
    expect(flags.phoneOtp).toBe(false);
    const { getSmsProvider } = await import("../../src/domains/auth/sms");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    expect(await getSmsProvider().sendOtp("+989121234567", "123456")).toEqual({
      ok: false,
      error: "sms_delivery_unavailable",
    });
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("requires a complete SMTP configuration before enabling email OTP", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_DEV_OTP", "false");
    vi.stubEnv("EMAIL_PROVIDER", "smtp");
    vi.stubEnv("EMAIL_SMTP_HOST", "smtp.mx.cloudflare.net");
    vi.stubEnv("EMAIL_SMTP_USER", "api_token");
    vi.stubEnv("EMAIL_SMTP_PASS", "");
    vi.resetModules();
    expect((await import("../../src/config/env")).flags.emailOtp).toBe(false);
    vi.stubEnv("EMAIL_SMTP_PASS", "test-token");
    vi.resetModules();
    expect((await import("../../src/config/env")).flags.emailOtp).toBe(true);
  });

  it("requires an authenticated HTTPS SMS provider in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_DEV_OTP", "false");
    vi.stubEnv("SMS_PROVIDER", "generic");
    vi.stubEnv("SMS_GENERIC_URL", "http://example.test/sms");
    vi.stubEnv("SMS_GENERIC_KEY", "test-key");
    vi.resetModules();
    expect((await import("../../src/config/env")).flags.phoneOtp).toBe(false);
    vi.stubEnv("SMS_GENERIC_URL", "https://example.test/sms");
    vi.resetModules();
    expect((await import("../../src/config/env")).flags.phoneOtp).toBe(true);
  });

  it("treats a Kavenegar application error as failure even on HTTP 200", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SMS_PROVIDER", "kavenegar");
    vi.stubEnv("SMS_KAVENEGAR_API_KEY", "test-key");
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      return: { status: 424 }, entries: null,
    }), { status: 200 })).mockResolvedValueOnce(new Response(JSON.stringify({
      return: { status: 200 }, entries: { messageid: 123 },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { getSmsProvider } = await import("../../src/domains/auth/sms");
    const provider = getSmsProvider();
    expect((await provider.sendOtp("+989121234567", "123456")).ok).toBe(false);
    expect((await provider.sendOtp("+989121234567", "654321")).ok).toBe(true);
    const [, options] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(String(options.body)).toContain("receptor=09121234567");
    expect(String(options.body)).toContain("template=foryxo-otp");
    expect(fetchMock.mock.calls[1][0]).not.toContain("654321");
  });
});
