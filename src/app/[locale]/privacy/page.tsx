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
  return { title: t.legal.privacy, alternates: alternatesFor(l, "/privacy") };
}

export default async function PrivacyPage({
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
        title={t.legal.privacy}
        intro={
          fa
            ? "حداقل داده ممکن را جمع می‌کنیم و فقط برای ارائهٔ خدمت استفاده می‌کنیم."
            : "We collect the minimum data needed and use it only to provide the service."
        }
        warning={t.legal.draftWarning}
        updatedFa="آخرین بازبینی:"
        updatedEn="Last reviewed:"
        sections={
          fa
            ? [
                { h: "داده‌هایی که جمع می‌کنیم", p: "برای حساب کاری: نام، ایمیل یا موبایل، اطلاعات کسب‌وکار و محتوای منو. مشاهده ساده منو نیاز به ثبت‌نام ندارد و آمار بازدید به‌صورت تجمیعی ذخیره می‌شود. اگر مهمان سفارش ثبت کند، نام، شماره تماس، نوع دریافت، اقلام، یادداشت و در صورت ارسال، نشانی تحویل را دریافت می‌کنیم." },
                { h: "سفارش و اشتراک با شعبه", p: "اطلاعات سفارش فقط در اختیار کسب‌وکار و شعبه انتخاب‌شده، کارکنان مجاز آن و ارائه‌دهندگان فنی ضروری قرار می‌گیرد تا سفارش تأیید، آماده، تحویل و پشتیبانی شود. شماره تماس برای هماهنگی همان سفارش است و برای بازاریابی بدون رضایت جداگانه استفاده نمی‌شود." },
                { h: "کوکی‌ها", p: "فقط کوکی‌های ضروری (نشست ورود، زبان و پوسته). از ردیابی تبلیغاتی یا انگشت‌نگاری استفاده نمی‌کنیم." },
                { h: "پرداخت", p: "اطلاعات کارت بانکی هرگز به سرورهای ما نمی‌رسد؛ پرداخت روی درگاه بانکی انجام می‌شود و ما فقط وضعیت تراکنش را دریافت می‌کنیم." },
                { h: "حفظ داده", p: "سوابق سفارش، مالی و فاکتور فقط تا زمانی که برای ارائه خدمت، رسیدگی به اختلاف، امنیت و الزامات قانونی لازم باشد نگهداری می‌شوند؛ داده‌های تحلیلی و نشست‌های منقضی به‌صورت دوره‌ای پاک می‌شوند." },
                { h: "حقوق شما", p: "می‌توانید خروجی داده‌های پروفایل خود را درخواست کنید، رضایت بازاریابی را لغو کنید یا حساب خود را حذف کنید؛ اسناد مالی لازم به‌جا می‌ماند." },
              ]
            : [
                { h: "Data we collect", p: "For business accounts: name, email or mobile, business info and menu content. Browsing a menu needs no account and view analytics are aggregated. If a guest places an order, we collect their name, phone, fulfillment choice, items, notes and, for delivery, the delivery address." },
                { h: "Orders and branch sharing", p: "Order details are shared only with the selected business and branch, their authorized staff, and necessary technical providers so the order can be confirmed, prepared, delivered and supported. The phone number is for coordinating that order and is not used for marketing without separate consent." },
                { h: "Cookies", p: "Only essential cookies (sign-in session, language, theme). No advertising trackers or fingerprinting." },
                { h: "Payments", p: "Card data never touches our servers; payment happens on the bank gateway and we receive only the transaction status." },
                { h: "Retention", p: "Order, financial and invoice records are kept only as needed to deliver the service, resolve disputes, protect security and meet legal duties; analytics and expired sessions are purged periodically." },
                { h: "Your rights", p: "Request an export of your profile data, withdraw marketing consent, or delete your account; legally required financial documents remain." },
              ]
        }
      />
    </LegalShell>
  );
}
