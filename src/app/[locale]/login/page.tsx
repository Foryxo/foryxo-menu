import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { LoginPanel } from "./login-panel";
import { auth } from "@/domains/auth/server";
import { headers } from "next/headers";
import { getRequestGeography } from "@/domains/geo/location";
import { flags } from "@/config/env";
import { localizedSafeNext } from "@/domains/i18n/safe-next";

export const metadata: Metadata = {
  title: "ورود | Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  if (!isLocale(locale)) redirect("/fa/login");
  const t = getDictionary(locale);

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders }).catch(() => null);
  if (session?.user) {
    const role = (session.user as { role?: string }).role ?? "business";
    const fallback = ["superadmin", "admin", "finance", "support", "editor"].includes(role)
      ? `/${locale}/admin`
      : role === "creator" ? `/${locale}/creator` : `/${locale}/dashboard`;
    redirect(localizedSafeNext(next, locale) ?? fallback);
  }

  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const geography = getRequestGeography(requestHeaders);
  const phoneEnabled = flags.phoneOtp && (geography.countryCode
    ? geography.isIran
    : process.env.NODE_ENV !== "production");

  return (
    <PageShell locale={locale}>
      <section className="mx-auto flex max-w-md flex-col px-4 pb-24 pt-16">
        <h1 className="display-2 text-center">{t.auth.loginTitle}</h1>
        <p className="mt-2 text-center text-sm text-muted">{t.auth.loginSubtitle}</p>
        {!flags.emailOtp && !phoneEnabled && !googleEnabled ? (
          <p className="mt-6 rounded-xl border border-amber-400/50 bg-amber-500/10 p-4 text-center text-sm" role="status">
            {locale === "fa" ? "ورود در حال راه‌اندازی است. ارسال کد تا فعال شدن سرویس ایمیل یا پیامک در دسترس نیست." : "Sign-in is being configured. Codes cannot be sent until email or SMS delivery is enabled."}
          </p>
        ) : null}
        <div className="mt-10">
          <LoginPanel
            locale={locale}
            next={localizedSafeNext(next, locale)}
            googleEnabled={googleEnabled}
            emailEnabled={flags.emailOtp}
            phoneEnabled={phoneEnabled}
            labels={{
              email: t.auth.email,
              phone: t.auth.phone,
              googleLogin: t.auth.googleLogin,
              sendCode: t.auth.sendCode,
              resendIn: t.auth.resendIn,
              seconds: t.auth.seconds,
              otpPlaceholder: t.auth.otpPlaceholder,
              verify: t.auth.verify,
              invalidOtp: t.auth.invalidOtp,
              tooManyAttempts: t.auth.tooManyAttempts,
              sentEmail: t.auth.sentEmail,
              sentPhone: t.auth.sentPhone,
              devOtp: t.auth.devOtp,
              noAccount: t.auth.noAccount,
              terms: t.auth.terms,
              error: t.common.error,
            }}
          />
        </div>
        <p className="mt-6 text-center text-xs text-muted">{t.auth.noAccount}</p>
        <p className="mt-8 text-center text-[11px] leading-5 text-muted">
          {t.auth.terms}
        </p>
      </section>
    </PageShell>
  );
}
