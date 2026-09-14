/**
 * SMS provider abstraction (spec §25). Business logic depends on this
 * interface only; concrete vendors plug in via env config.
 */
import { env } from "@/config/env";

export interface SmsProvider {
  readonly name: string;
  sendOtp(phone: string, code: string): Promise<{ ok: boolean; error?: string }>;
  sendMessage(phone: string, message: string): Promise<{ ok: boolean; error?: string }>;
}

class ConsoleSmsProvider implements SmsProvider {
  readonly name = "console";
  async sendOtp(phone: string, code: string) {
    console.log(`[SMS:dev] OTP for ${phone}: ${code}`);
    return { ok: true };
  }
  async sendMessage(phone: string, message: string) {
    console.log(`[SMS:dev] to ${phone}: ${message}`);
    return { ok: true };
  }
}

class KavenegarProvider implements SmsProvider {
  readonly name = "kavenegar";
  constructor(private apiKey: string) {}
  async sendOtp(phone: string, code: string) {
    // Kavenegar Verify API — official HTTP API.
    const url = `https://api.kavenegar.com/v1/${this.apiKey}/verify/lookup.json?receptor=${encodeURIComponent(phone)}&token=${code}&template=foryxo-otp`;
    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) return { ok: false, error: `kavenegar_http_${res.status}` };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
  async sendMessage(phone: string, message: string) {
    const url = `https://api.kavenegar.com/v1/${this.apiKey}/sms/send.json?receptor=${encodeURIComponent(phone)}&message=${encodeURIComponent(message)}`;
    try {
      const res = await fetch(url, { method: "POST" });
      return res.ok ? { ok: true } : { ok: false, error: `kavenegar_http_${res.status}` };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
}

class GenericHttpProvider implements SmsProvider {
  readonly name = "generic";
  constructor(private url: string, private key: string) {}
  private async post(body: Record<string, string>) {
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.key}` },
        body: JSON.stringify(body),
      });
      return res.ok ? { ok: true } : { ok: false, error: `sms_http_${res.status}` };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
  sendOtp(phone: string, code: string) {
    return this.post({ to: phone, text: `Foryxo Menu code: ${code}`, template: "otp" });
  }
  sendMessage(phone: string, message: string) {
    return this.post({ to: phone, text: message });
  }
}

export function getSmsProvider(): SmsProvider {
  switch (env.SMS_PROVIDER) {
    case "kavenegar":
      if (!env.SMS_KAVENEGAR_API_KEY) {
        console.warn("SMS_PROVIDER=kavenegar but no API key; falling back to console");
        return new ConsoleSmsProvider();
      }
      return new KavenegarProvider(env.SMS_KAVENEGAR_API_KEY);
    case "generic":
      if (!env.SMS_GENERIC_URL) return new ConsoleSmsProvider();
      return new GenericHttpProvider(env.SMS_GENERIC_URL, env.SMS_GENERIC_KEY ?? "");
    default:
      return new ConsoleSmsProvider();
  }
}
