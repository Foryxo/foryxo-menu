/**
 * SMS provider abstraction (spec §25). Business logic depends on this
 * interface only; concrete vendors plug in via env config.
 */
import { env, isProd } from "@/config/env";

export interface SmsProvider {
  readonly name: string;
  sendOtp(phone: string, code: string): Promise<{ ok: boolean; error?: string }>;
  sendMessage(phone: string, message: string): Promise<{ ok: boolean; error?: string }>;
}

class ConsoleSmsProvider implements SmsProvider {
  readonly name = "console";
  async sendOtp(phone: string, code: string) {
    if (isProd) return { ok: false, error: "sms_delivery_unavailable" };
    console.log(`[SMS:dev] OTP for ${phone}: ${code}`);
    return { ok: true };
  }
  async sendMessage(phone: string, message: string) {
    if (isProd) return { ok: false, error: "sms_delivery_unavailable" };
    console.log(`[SMS:dev] to ${phone}: ${message}`);
    return { ok: true };
  }
}

class KavenegarProvider implements SmsProvider {
  readonly name = "kavenegar";
  constructor(private apiKey: string) {}
  private async post(path: string, fields: Record<string, string>) {
    const url = `https://api.kavenegar.com/v1/${encodeURIComponent(this.apiKey)}/${path}.json`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(fields),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return { ok: false, error: `kavenegar_http_${res.status}` };
      const data = await res.json() as { return?: { status?: number }; entries?: unknown };
      return data.return?.status === 200 && data.entries
        ? { ok: true }
        : { ok: false, error: `kavenegar_api_${data.return?.status ?? "invalid"}` };
    } catch {
      return { ok: false, error: "kavenegar_network_error" };
    }
  }
  async sendOtp(phone: string, code: string) {
    const receptor = phone.startsWith("+98") ? `0${phone.slice(3)}` : phone;
    return this.post("verify/lookup", { receptor, token: code, template: "foryxo-otp" });
  }
  async sendMessage(phone: string, message: string) {
    const receptor = phone.startsWith("+98") ? `0${phone.slice(3)}` : phone;
    return this.post("sms/send", { receptor, message });
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
        signal: AbortSignal.timeout(10_000),
      });
      return res.ok ? { ok: true } : { ok: false, error: `sms_http_${res.status}` };
    } catch {
      return { ok: false, error: "sms_network_error" };
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
        throw new Error("SMS_DELIVERY_UNAVAILABLE");
      }
      return new KavenegarProvider(env.SMS_KAVENEGAR_API_KEY);
    case "generic":
      if (!env.SMS_GENERIC_URL || !env.SMS_GENERIC_KEY || (isProd && !env.SMS_GENERIC_URL.startsWith("https://"))) {
        throw new Error("SMS_DELIVERY_UNAVAILABLE");
      }
      return new GenericHttpProvider(env.SMS_GENERIC_URL, env.SMS_GENERIC_KEY);
    default:
      return new ConsoleSmsProvider();
  }
}
