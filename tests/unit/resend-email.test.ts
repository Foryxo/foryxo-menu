import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

const message = {
  to: "recipient@example.test",
  subject: "Your sign-in code",
  html: "<p>123456</p>",
  text: "123456",
  replyTo: "support@foryxo.com",
};

describe("Resend outbound email adapter", () => {
  it("keeps development console mode usable without a key", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("EMAIL_PROVIDER", "console");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.resetModules();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { deliverEmail } = await import("../../src/domains/email/queue");
    await expect(deliverEmail(message)).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("never sends in production without a Resend key", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.resetModules();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { deliverEmail } = await import("../../src/domains/email/queue");
    await expect(deliverEmail(message)).rejects.toThrow("EMAIL_DELIVERY_UNAVAILABLE");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends to Resend with the configured sender and only server-held credentials", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "test-only-key");
    vi.stubEnv("EMAIL_FROM", "Foryxo <otp@foryxo.com>");
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "email-id" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { deliverEmail } = await import("../../src/domains/email/queue");
    await expect(deliverEmail(message)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.method).toBe("POST");
    expect((options.headers as Record<string, string>).Authorization).toBe("Bearer test-only-key");
    expect(JSON.parse(String(options.body))).toEqual({
      from: "Foryxo <otp@foryxo.com>",
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
    });
  });

  it("fails closed on provider errors and malformed acceptance responses", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "test-only-key");
    vi.resetModules();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "invalid key" }), { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    const { deliverEmail } = await import("../../src/domains/email/queue");
    await expect(deliverEmail(message)).rejects.toThrow("EMAIL_DELIVERY_HTTP_403");
    await expect(deliverEmail(message)).rejects.toThrow("EMAIL_DELIVERY_INVALID_RESPONSE");
    await expect(deliverEmail(message)).rejects.toThrow("EMAIL_DELIVERY_NETWORK_ERROR");
  });
});
