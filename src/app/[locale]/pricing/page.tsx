import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { alternatesFor } from "@/domains/seo/hreflang";
import { formatToman } from "@/domains/i18n/format";
import { CATALOG } from "@/domains/pricing/calculator";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  return { title: t.pricing.title, description: t.pricing.subtitle, alternates: alternatesFor(l, "/pricing") };
}

const PACKAGES = ["package.basic", "package.plus", "package.pro", "package.business"] as const;
const PACKAGE_DESC: Record<string, { fa: string; en: string }> = {
  "package.basic": { fa: "منوی استاتیک زیبا با هویت خودتان", en: "A beautiful static menu with your identity" },
  "package.plus": { fa: "منوی دوزبانه با امکانات بیشتر", en: "Bilingual menu with more capability" },
  "package.pro": { fa: "منوی مدیریتی با پنل اختصاصی", en: "Managed menu with your own editor" },
  "package.business": { fa: "سفارش‌گیری کامل با QR میز و درگاه", en: "Full ordering with table QR & payments" },
};
const HOSTING = ["hosting.basic", "hosting.support", "hosting.managed"] as const;
const ADDON_CATEGORIES = ["addon", "content"] as const;

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);

  const price = (key: string) => CATALOG.find((c) => c.key === key)?.default ?? 0;
  const addonLabel = (key: string) => {
    // Human-readable labels; canonical source is price_catalog seeded in DB (admin-editable).
    const map: Record<string, [string, string]> = {
      "addon.english": ["نسخه انگلیسی", "English version"],
      "addon.language": ["هر زبان تکمیلی", "Each additional language"],
      "addon.admin_lite": ["پنل مدیریت لایت", "Admin panel Lite"],
      "addon.admin_full": ["پنل مدیریت کامل", "Admin panel Full"],
      "addon.search": ["جستجو", "Search"],
      "addon.favorites": ["علاقه‌مندی‌ها", "Favorites"],
      "addon.cart": ["سبد سفارش", "Cart"],
      "addon.whatsapp": ["سفارش واتساپ", "WhatsApp ordering"],
      "addon.telegram": ["سفارش تلگرام", "Telegram ordering"],
      "addon.ordering_full": ["سفارش‌گیری کامل", "Full ordering"],
      "addon.payment_gateway": ["اتصال درگاه پرداخت", "Payment gateway"],
      "addon.table_qr": ["QR دائمی هر میز", "Permanent QR per table"],
      "addon.call_waiter": ["فراخوان گارسون", "Call waiter"],
      "addon.branch": ["شعبه اضافه", "Additional branch"],
      "addon.branch_unique_menu": ["منوی اختصاصی شعبه", "Unique branch menu"],
      "addon.discounts": ["سیستم تخفیف", "Discount system"],
      "addon.hours_automation": ["اتوماسیون ساعت کاری", "Opening-hours automation"],
      "addon.pwa": ["PWA", "PWA"],
      "addon.analytics_lite": ["آمار پایه", "Analytics Lite"],
      "addon.analytics_pro": ["آمار پیشرفته", "Analytics Pro"],
      "addon.domain_setup": ["اتصال دامنه", "Custom-domain setup"],
      "content.entry_50": ["ورود اطلاعات تا ۵۰ آیتم", "Data entry up to 50 items"],
      "content.entry_extra_50": ["۵۰ آیتم اضافه", "Each extra 50 items"],
      "content.image_cleanup": ["پردازش هر عکس", "Per-image cleanup"],
    };
    const entry = map[key];
    return entry ? (fa ? entry[0] : entry[1]) : key;
  };

  return (
    <PageShell locale={l}>
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-12">
        <h1 className="display-1">{t.pricing.title}</h1>
        <p className="lede mt-3">{t.pricing.subtitle}</p>

        {/* Packages */}
        <h2 className="display-3 mt-12">{t.pricing.packages}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((key, i) => (
            <div
              key={key}
              className={`surface relative flex flex-col rounded-2xl p-6 ${i === 1 ? "ring-2 ring-[var(--accent)]" : ""}`}
            >
              {i === 1 ? (
                <span className="absolute -top-3 start-6 rounded-full accent-bg px-3 py-0.5 text-xs font-bold">
                  {t.pricing.popular}
                </span>
              ) : null}
              <h3 className="text-lg font-extrabold">{key.split(".")[1].toUpperCase()}</h3>
              <p className="mt-1 min-h-10 text-sm text-muted">{PACKAGE_DESC[key][fa ? "fa" : "en"]}</p>
              <p className="mt-4 text-2xl font-black accent-text">
                {formatToman(price(key), l)}
                <span className="block text-xs font-semibold text-muted">{t.pricing.setup}</span>
              </p>
              <Link
                href={`/${l}/build`}
                className="mt-6 flex h-11 items-center justify-center rounded-xl accent-bg text-sm font-bold"
              >
                {t.nav.startMenu}
              </Link>
            </div>
          ))}
        </div>

        {/* Hosting */}
        <h2 className="display-3 mt-14">{t.pricing.hosting}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {HOSTING.map((key) => (
            <div key={key} className="surface-subtle flex items-center justify-between rounded-2xl p-5">
              <div>
                <h3 className="font-bold">{key.split(".")[1] === "basic" ? (fa ? "پایه" : "Basic") : key.split(".")[1] === "support" ? (fa ? "هاستینگ + پشتیبانی" : "Hosting + support") : fa ? "به‌روزرسانی مدیریتی" : "Managed updates"}</h3>
                <p className="text-xs text-muted">{t.pricing.annual}</p>
              </div>
              <p className="text-lg font-black">{formatToman(price(key), l)}</p>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <h2 className="display-3 mt-14">{t.pricing.addons}</h2>
        <div className="mt-6 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <tbody>
              {CATALOG.filter((c) => ADDON_CATEGORIES.some((p) => c.key.startsWith(p))).map((c, i) => (
                <tr key={c.key} className={i % 2 ? "bg-subtle" : "bg-elevated"}>
                  <td className="px-4 py-3 font-semibold">{addonLabel(c.key)}</td>
                  <td className="px-4 py-3 text-end font-bold">
                    {formatToman(c.default, l)}
                    {c.key === "addon.table_qr" ? <span className="ms-1 text-xs font-medium text-muted">{fa ? "برای هر میز" : "per table"}</span> : null}
                    {c.key === "addon.language" ? <span className="ms-1 text-xs font-medium text-muted">{fa ? "برای هر زبان" : "per language"}</span> : null}
                    {c.key === "addon.branch" ? <span className="ms-1 text-xs font-medium text-muted">{fa ? "برای هر شعبه اضافه" : "per additional branch"}</span> : null}
                    {c.key === "addon.branch_unique_menu" ? <span className="ms-1 text-xs font-medium text-muted">{fa ? "برای هر منوی شعبه‌ای" : "per branch menu variant"}</span> : null}
                    {c.key === "content.image_cleanup" ? <span className="ms-1 text-xs font-medium text-muted">{fa ? "برای هر تصویر؛ ویرایش سنگین با تأیید قیمت" : "per image; heavier edits quoted first"}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-elevated p-5 text-sm leading-7 text-muted">
            <strong className="block text-fg">{fa ? "عکس‌های غذای خودتان را دارید؟" : "Already have your own food photos?"}</strong>
            {fa ? "همه تصاویر را یک‌جا بارگذاری کنید، برای هر فایل نام غذا و توضیح ویرایش بنویسید. فوریکسو عکس‌ها را اصلاح می‌کند و روی آیتم درست منو قرار می‌دهد؛ وضعیت هر تصویر در پنل شما قابل پیگیری است." : "Upload them together, add a dish name and editing note to each file, and Foryxo will retouch and place every photo on the correct menu item. Each image has a trackable status in your dashboard."}
          </div>
          <div className="rounded-2xl border border-line bg-elevated p-5 text-sm leading-7 text-muted">
            <strong className="block text-fg">{fa ? "منوی چندزبانه چطور قیمت‌گذاری می‌شود؟" : "How is a multilingual menu priced?"}</strong>
            {fa ? "بسته Plus فارسی و انگلیسی را پوشش می‌دهد. عربی، روسی، ترکی یا هر زبان اضافه به‌ازای هر زبان محاسبه می‌شود و ترجمه نام، توضیح و دسته‌بندی با چیدمان درست همان زبان تحویل می‌شود." : "Plus covers Persian and English. Arabic, Russian, Turkish, or any further language is charged per language and includes item names, descriptions, categories, and the correct reading direction."}
          </div>
          <div className="rounded-2xl border border-line bg-elevated p-5 text-sm leading-7 text-muted">
            <strong className="block text-fg">{fa ? "چه زمانی QR هر میز لازم است؟" : "When do you need a QR per table?"}</strong>
            {fa ? "برای نمایش منو، QR اصلی رایگان کافی است. QR میز زمانی هزینه دارد که سفارش، فراخوان گارسون یا گزارش خدمات باید شماره همان میز را خودکار تشخیص دهد؛ این موضوع ربطی به فودکورت یا چند منو بودن ندارد." : "For menu viewing, the included main QR is enough. Table QR codes are useful when ordering, waiter calls, or service analytics must identify that table automatically; this is not limited to food courts or multi-menu venues."}
          </div>
        </div>

        <p className="mt-6 text-sm text-muted">{t.pricing.domainNote}</p>
        <p className="mt-2 text-sm text-muted">
          {fa
            ? "برای ترکیب دقیق امکانات، برآورد لحظه‌ای را در سازنده منو ببینید."
            : "For an exact combination of features, see the instant estimate in the builder."}
        </p>
      </section>
    </PageShell>
  );
}
