"use client";

/**
 * Auth panel: email OTP via Better Auth; phone OTP via /api/auth/phone;
 * Google via Better Auth social sign-in. Generic errors; no enumeration.
 */
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { authClient } from "@/domains/auth/client";
import { toAsciiDigits } from "@/domains/i18n/normalize";
import type { Locale } from "@/domains/i18n/config";
import { localizedSafeNext } from "@/domains/i18n/safe-next";

interface Labels {
  email: string;
  phone: string;
  googleLogin: string;
  sendCode: string;
  resendIn: string;
  seconds: string;
  otpPlaceholder: string;
  verify: string;
  invalidOtp: string;
  tooManyAttempts: string;
  sentEmail: string;
  sentPhone: string;
  devOtp: string;
  noAccount: string;
  terms: string;
  error: string;
}

type Method = "email" | "phone";

export function LoginPanel({
  locale,
  next,
  googleEnabled,
  emailEnabled,
  phoneEnabled,
  labels: L,
}: {
  locale: Locale;
  next: string | null;
  googleEnabled: boolean;
  emailEnabled: boolean;
  phoneEnabled: boolean;
  labels: Labels;
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"input" | "code">("input");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const identifierId = useId();
  const codeId = useId();
  const method = useMemo<Method>(
    () => (identifier.includes("@") ? "email" : "phone"),
    [identifier],
  );
  const identifierLooksValid =
    method === "email"
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())
      : /^\+?\d[\d\s()-]{8,18}$/.test(toAsciiDigits(identifier.trim()));

  async function finishSignIn() {
    const safeNext = localizedSafeNext(next, locale);
    if (safeNext) {
      router.push(safeNext);
      router.refresh();
      return;
    }
    const response = await fetch("/api/auth/get-session", {
      cache: "no-store",
    }).catch(() => null);
    const data = response?.ok ? await response.json().catch(() => null) : null;
    const role = data?.user?.role ?? "business";
    const destination = [
      "superadmin",
      "admin",
      "finance",
      "support",
      "editor",
    ].includes(role)
      ? `/${locale}/admin`
      : role === "creator"
        ? `/${locale}/creator`
        : `/${locale}/dashboard`;
    router.push(destination);
    router.refresh();
  }

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!identifierLooksValid) {
        setError(
          locale === "fa"
            ? "ایمیل یا شماره موبایل معتبر وارد کنید."
            : "Enter a valid email address or mobile number.",
        );
        return;
      }
      if (method === "phone" && !phoneEnabled) {
        setError(
          locale === "fa"
            ? "ورود پیامکی فقط برای شماره‌های ایران فعال است؛ لطفاً ایمیل وارد کنید."
            : "SMS sign-in is available for Iranian numbers; please use email from your location.",
        );
        return;
      }
      if (method === "email") {
        if (!emailEnabled) {
          setError(locale === "fa" ? "ارسال کد ایمیل هنوز فعال نشده است." : "Email code delivery is not available yet.");
          return;
        }
        const res = await authClient.emailOtp.sendVerificationOtp({
          email: identifier.trim().toLowerCase(),
          type: "sign-in",
        });
        if (res.error) {
          setError(res.error.status === 429 ? L.tooManyAttempts : L.error);
          return;
        }
        setStage("code");
        setCooldown(60);
      } else {
        const res = await fetch("/api/auth/phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send",
            phone: toAsciiDigits(identifier),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(
            data.error === "invalid_phone"
              ? locale === "fa"
                ? "شماره موبایل معتبر نیست."
                : "Invalid mobile number."
              : L.error,
          );
          return;
        }
        if (data.devCode) setDevCode(data.devCode);
        setStage("code");
        setCooldown(60);
      }
    } catch {
      setError(L.error);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (method === "email") {
        const res = await authClient.signIn.emailOtp({
          email: identifier.trim().toLowerCase(),
          otp: code,
        });
        if (res.error) {
          setError(res.error.status === 429 ? L.tooManyAttempts : L.invalidOtp);
          return;
        }
      } else {
        const res = await fetch("/api/auth/phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify",
            phone: toAsciiDigits(identifier),
            code,
          }),
        });
        if (!res.ok) {
          setError(res.status === 429 ? L.tooManyAttempts : L.invalidOtp);
          return;
        }
      }
      await finishSignIn();
    } catch {
      setError(L.error);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  return (
    <div className="space-y-6">
      {stage === "input" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <label htmlFor={identifierId} className="text-sm font-semibold">
            {locale === "fa"
              ? "ایمیل یا شماره موبایل"
              : "Email or mobile number"}
          </label>
          <Input
            id={identifierId}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            type="text"
            inputMode={method === "email" ? "email" : "tel"}
            dir="ltr"
            placeholder={
              phoneEnabled
                ? locale === "fa"
                  ? "example@domain.com یا 0912…"
                  : "you@example.com or +98…"
                : "you@example.com"
            }
            autoComplete="username"
            required
            maxLength={80}
          />
          <p
            className="rounded-xl bg-subtle px-3 py-2 text-xs leading-5 text-muted"
            aria-live="polite"
          >
            {identifier.length === 0
              ? locale === "fa"
                ? "نوع ورودی را خودکار تشخیص می‌دهیم و کد یک‌بارمصرف می‌فرستیم."
                : "We detect the input automatically and send a one-time code."
              : method === "email"
                ? locale === "fa"
                  ? "کد به ایمیل ارسال می‌شود."
                  : "The code will be sent by email."
                : phoneEnabled
                  ? locale === "fa"
                    ? "کد به شماره موبایل ایران ارسال می‌شود."
                    : "The code will be sent to this Iranian mobile number."
                  : locale === "fa"
                    ? "در موقعیت شما ورود با ایمیل فعال است."
                    : "Email sign-in is available in your location."}
          </p>
          <Button type="submit" className="w-full" size="lg" loading={busy}>
            {L.sendCode}
          </Button>
          {googleEnabled ? (
            <>
              <div
                className="flex items-center gap-3 text-xs text-muted"
                aria-hidden="true"
              >
                <span className="h-px flex-1 bg-[var(--line)]" />
                or
                <span className="h-px flex-1 bg-[var(--line)]" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() =>
                  authClient.signIn.social({
                    provider: "google",
                    callbackURL: localizedSafeNext(next, locale) ?? `/${locale}/dashboard`,
                  })
                }
              >
                {L.googleLogin}
              </Button>
            </>
          ) : null}
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          {devCode ? (
            <p
              className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              role="status"
            >
              {L.devOtp}: <span dir="ltr">{devCode}</span>
            </p>
          ) : (
            <p className="text-center text-sm text-muted" role="status">
              {method === "email" ? L.sentEmail : L.sentPhone}
            </p>
          )}
          <label htmlFor={codeId} className="sr-only">
            {L.otpPlaceholder}
          </label>
          <Input
            id={codeId}
            value={code}
            onChange={(e) =>
              setCode(
                toAsciiDigits(e.target.value).replace(/\D/g, "").slice(0, 6),
              )
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            dir="ltr"
            placeholder={L.otpPlaceholder}
            className="text-center text-lg tracking-[0.5em]"
            required
          />
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" size="lg" loading={busy}>
            {L.verify}
          </Button>
          <button
            type="button"
            onClick={() => sendCode()}
            disabled={cooldown > 0 || busy}
            className="w-full text-center text-xs font-semibold text-muted hover:text-fg disabled:opacity-50"
          >
            {cooldown > 0
              ? `${L.resendIn} ${cooldown} ${L.seconds}`
              : L.sendCode}
          </button>
        </form>
      )}
      {stage === "input" && error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
