import type { Metadata } from "next";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { alternatesFor } from "@/domains/seo/hreflang";
import { LegalBody, LegalShell } from "@/components/site/legal-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  return { title: t.legal.refundPolicy, alternates: alternatesFor(l, "/refund-policy") };
}

export default async function RefundPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  const fa = l === "fa";

  return (
    <LegalShell locale={l}>
      <LegalBody
        title={t.legal.refundPolicy}
        intro={
          fa
            ? "درخواست بازگشت وجه پس از بررسی، حداکثر ظرف ۲۴ ساعت کاری پردازش می‌شود."
            : "Eligible refund requests are reviewed and processed within up to 24 business hours."
        }
        warning={t.legal.draftWarning}
        updatedFa="آخرین بازبینی:"
        updatedEn="Last reviewed:"
        sections={
          fa
            ? [
                { h: "چه مبلغی قابل بازگشت است؟", p: "اعتبار خدمات استفاده‌نشده و پرداخت‌شده با پول واقعی قابل بازگشت است. اعتبار هدیه یا تشویقی، و هزینهٔ کارهایی که طبق استعلام تأییدشده انجام شده‌اند، قابل بازگشت نیستند." },
                { h: "مسیر بازگشت", p: "ترجیحاً به همان روش پرداخت اولیه. در غیر این صورت، پس از تأیید هویت، به حساب بانکی معتبر شما واریز می‌شود." },
                { h: "زمان‌بندی", p: "بررسی و پردازش در فوریکسو حداکثر ۲۴ ساعت کاری است. تسویه نهایی بانکی بسته به بانک ممکن است چند روز کاری بیشتر زمان ببرد؛ این بخش خارج از کنترل فوریکسو است." },
                { h: "کنسل کردن پروژه", p: "اگر پیش از شروع کار انصراف دهید، کل مبلغ به اعتبار شما برمی‌گردد. اگر در میانه کار انصراف دهید، هزینهٔ بخش انجام‌شده کسر و باقی آزاد می‌شود." },
                { h: "درخواست", p: "از پنل کاربری → کیف پول → «درخواست بازگشت وجه» مبلغ و دلیل را ثبت کنید. وضعیت درخواست را همان‌جا می‌بینید." },
              ]
            : [
                { h: "What is refundable?", p: "Unused service credit paid with real money is refundable. Promotional/bonus credit and fees for work completed under an approved quote are not." },
                { h: "Refund route", p: "Preferably to the original payment method. Otherwise, after identity verification, to a verified bank account in your name." },
                { h: "Timing", p: "Foryxo review and processing takes up to 24 business hours. Final bank settlement may take additional business days depending on the bank — outside Foryxo's control." },
                { h: "Cancelling a project", p: "Cancel before work starts and the full amount returns to your credit. Cancel mid-project and the completed portion is charged while the rest is released." },
                { h: "How to request", p: "Dashboard → Wallet → Request refund: enter the amount and reason. Track the status in the same place." },
              ]
        }
      />
    </LegalShell>
  );
}
