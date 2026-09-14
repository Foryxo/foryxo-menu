import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { alternatesFor } from "@/domains/seo/hreflang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  return { title: t.legal.security, description: t.legal.security, alternates: alternatesFor(l, "/security") };
}

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);

  const items = fa
    ? [
        { h: "رمزنگاری", p: "همه ترافیک روی HTTPS است؛ رمزهای عبور و کدهای یک‌بارمصرف هش شده ذخیره می‌شوند و هرگز در لاگ‌ها ظاهر نمی‌شوند." },
        { h: "جدا بودن داده مشتریان", p: "هر کسب‌وکار فقط به داده خودش دسترسی دارد؛ تمام درخواست‌ها سمت سرور بررسی مجوز می‌شوند." },
        { h: "پرداخت امن", p: "پرداخت‌ها همیشه سمت سرور تأیید می‌شوند؛ به پارامترهای بازگشتی درگاه اعتماد نمی‌کنیم و همه تراکنش‌ها دارای شناسه تکرارناپذیرند." },
        { h: "محدودسازی نرخ", p: "درخواست‌های حساس مثل ارسال کد ورود، ورود و آپلود فایل محدودسازی نرخ سخت‌گیرانه دارند." },
        { h: "گزارش رخداد امنیتی", p: "رویدادهای ورود، تغییرات مدیریتی و عملیات مالی در گزارش تغییرناپذیر ثبت می‌شوند." },
      ]
    : [
        { h: "Encryption", p: "All traffic runs over HTTPS; passwords and one-time codes are stored hashed and never appear in logs." },
        { h: "Tenant isolation", p: "Every business can only access its own data; all requests are authorized server-side." },
        { h: "Payment integrity", p: "Payments are verified server-to-server; return-page parameters are never trusted, and every transaction carries an idempotency key." },
        { h: "Rate limiting", p: "Sensitive endpoints — OTP send, sign-in, uploads — are aggressively rate-limited." },
        { h: "Audit trail", p: "Logins, admin changes and financial operations are recorded in an immutable audit log." },
      ];

  return (
    <PageShell locale={l}>
      <section className="mx-auto max-w-3xl px-4 pb-20 pt-12">
        <h1 className="display-1">{t.legal.security}</h1>
        <p className="lede mt-3">
          {fa
            ? "امنیت در فوریکسو منو یک ویژگی نیست؛ پیش‌نیاز است."
            : "Security is not a feature at Foryxo Menu — it is a prerequisite."}
        </p>
        <div className="mt-10 space-y-4">
          {items.map((i) => (
            <div key={i.h} className="surface rounded-2xl p-6">
              <h2 className="font-extrabold">{i.h}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{i.p}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-dashed border-line p-6 text-sm leading-7 text-muted">
          <h2 className="font-extrabold text-fg">
            {fa ? "گزارش آسیب‌پذیری" : "Report a vulnerability"}
          </h2>
          <p className="mt-2">
            {fa
              ? "اگر مشکل امنیتی پیدا کرده‌اید، جزئیات را به security@foryxo.com بفرستید. حداکثر ظرف ۷۲ ساعت پاسخ می‌دهیم."
              : "Found a security issue? Email details to security@foryxo.com. We respond within 72 hours."}
          </p>
        </div>
      </section>
    </PageShell>
  );
}
