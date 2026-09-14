import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { isLocale, getDictionary } from "@/domains/i18n/index";
import { CheckCircle2, CircleX, Clock3, QrCode, Undo2, type LucideIcon } from "lucide-react";

const EVENTS = ["payment-success", "payment-failed", "payment-cancelled", "rate-limited", "menu-unavailable", "account-suspended"] as const;

export default async function StatusPage({
  params,
}: {
  params: Promise<{ locale: string; event: string }>;
}) {
  const { locale, event } = await params;
  if (!isLocale(locale) || !EVENTS.includes(event as (typeof EVENTS)[number])) notFound();
  const t = getDictionary(locale);
  const fa = locale === "fa";

  const config = ({
    "payment-success": {
      icon: CheckCircle2,
      title: t.status.paymentSuccess,
      body: fa ? "رسید پرداخت در پنل کاربری شما قابل مشاهده است." : "The receipt is visible in your dashboard.",
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    "payment-failed": {
      icon: CircleX,
      title: t.status.paymentFailed,
      body: fa ? "مبلغی از حساب شما کسر نشده یا به‌صورت خودکار آزاد می‌شود. می‌توانید دوباره تلاش کنید." : "No amount was taken, or it will be released automatically. You can retry.",
      tone: "text-red-600 dark:text-red-400",
    },
    "payment-cancelled": {
      icon: Undo2,
      title: t.status.paymentCancelled,
      body: fa ? "پرداخت توسط شما لغو شد." : "The payment was cancelled.",
      tone: "text-amber-600 dark:text-amber-400",
    },
    "rate-limited": {
      icon: Clock3,
      title: fa ? "درخواست‌های بیش از حد" : "Too many requests",
      body: fa ? "کمی صبر کنید و دوباره تلاش کنید." : "Please wait a moment and try again.",
      tone: "text-amber-600 dark:text-amber-400",
    },
    "menu-unavailable": {
      icon: QrCode,
      title: fa ? "این منو فعلاً در دسترس نیست" : "This menu is currently unavailable",
      body: fa ? "کد QR معتبر نیست یا منو موقتاً منتشر نشده است. لطفاً از کارکنان مجموعه کمک بگیرید." : "The QR code is invalid or the menu is temporarily unpublished. Please ask the venue staff for help.",
      tone: "text-amber-600 dark:text-amber-400",
    },
    "account-suspended": {
      icon: CircleX,
      title: fa ? "دسترسی این حساب متوقف شده است" : "This account is suspended",
      body: fa ? "برای بررسی وضعیت حساب با پشتیبانی فوریکسو تماس بگیرید." : "Contact Foryxo support to review this account status.",
      tone: "text-red-600 dark:text-red-400",
    },
  } as Record<string, { icon: LucideIcon; title: string; body: string; tone: string }>)[event]!;
  const Icon = config.icon;

  return (
    <PageShell locale={locale}>
      <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <Icon className={`size-14 ${config.tone}`} aria-hidden="true" />
        <h1 className="display-2 mt-6">{config.title}</h1>
        <p className="mt-3 leading-7 text-muted">{config.body}</p>
        <div className="mt-8 flex gap-3">
          <Link href={`/${locale}/dashboard`} className="flex h-11 items-center rounded-xl accent-bg px-6 text-sm font-bold">
            {t.common.dashboard}
          </Link>
          <Link href={`/${locale}`} className="flex h-11 items-center rounded-xl border border-line px-6 text-sm font-semibold hover:bg-subtle">
            {fa ? "صفحه اصلی" : "Home"}
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
