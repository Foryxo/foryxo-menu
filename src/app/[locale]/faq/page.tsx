import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { alternatesFor } from "@/domains/seo/hreflang";
import { buildFaqJsonLd } from "@/domains/seo/jsonld";
import { ChevronDown } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  return { title: t.faq.title, description: t.faq.subtitle, alternates: alternatesFor(l, "/faq") };
}

const QA_FA = [
  { q: "منوی دیجیتال چیست؟", a: "منوی دیجیتال نسخهٔ آنلاین و تعاملی منوی شماست که مشتری با اسکن QR یا باز کردن لینک آن را روی گوشی می‌بیند: عکس، توضیح، قیمت به‌روز و امکان جستجو. برخلاف عکس یا PDF، منوی دیجیتال همیشه قابل به‌روزرسانی است و آمار بازدید می‌دهد." },
  { q: "قیمت طراحی منوی دیجیتال چقدر است؟", a: "منوی پایه از ۱٬۸۰۰٬۰۰۰ تومان شروع می‌شود. نسخه دوزبانه، پنل مدیریت و سفارش‌گیری هزینه اضافه دارد. می‌توانید در سازنده منو امکانات دلخواه را انتخاب کنید و برآورد لحظه‌ای ببینید." },
  { q: "QR منو چگونه کار می‌کند؟", a: "برای هر میز (یا هر شعبه) یک QR اختصاصی تولید می‌کنیم. مشتری QR را اسکن می‌کند و منو با شناسه میز باز می‌شود؛ در حالت سفارش‌گیری، شماره میز به‌صورت خودکار به سفارش اضافه می‌شود." },
  { q: "آیا منوی دیجیتال نیاز به دامنه دارد؟", a: "خیر. آدرس پیش‌فرض منوی شما menu.foryxo.com/menus/{نام-کسب‌وکار}/menu است. اگر دامنه اختصاصی می‌خواهید (مثل menu.cafe.ir)، راهنمای کامل DNS را به شما می‌دهیم و اتصال و SSL را انجام می‌دهیم." },
  { q: "منوی دو زبانه برای گردشگر چگونه ساخته می‌شود؟", a: "در گام زبان‌ها، فارسی + انگلیسی را انتخاب می‌کنید. تمام آیتم‌ها، توضیحات و دسته‌ها دو نسخه دارند و مشتری با یک دکمه بین فارسی و انگلیسی جابه‌جا می‌شود؛ جهت صفحه هم خودکار درست می‌شود." },
  { q: "تفاوت منوی PDF و منوی آنلاین چیست؟", a: "PDF قابل جستجو و به‌روزرسانی نیست، حجمش بالاست و روی موبایل خوب خوانده نمی‌شود. منوی آنلاین همیشه به‌روز است، برای موبایل طراحی شده، قابل جستجوست و آمار بازدید و پرفروش‌ها می‌دهد." },
  { q: "چگونه قیمت‌های منو را تغییر دهیم؟", a: "در حالت خودمدیریتی، از ویرایشگر منو قیمت را تغییر می‌دهید و فوراً اعمال می‌شود. در حالت مدیریتی، از بخش «درخواست‌ها» ثبت می‌کنید؛ تغییرات ساده معمولاً با هزینه کم یا رایگان انجام می‌شود." },
  { q: "آیا امکان سفارش از داخل منو وجود دارد؟", a: "بله؛ به‌صورت اختیاری. می‌توانید سفارش را به واتساپ یا تلگرام بفرستید یا سفارش‌گیری کامل با سبد، مودیفایر و پرداخت آنلاین فعال کنید. هر کسب‌وکار تصمیم می‌گیرد که کدام حالت را داشته باشد." },
  { q: "برای چند شعبه یک منو داریم یا چند منو؟", a: "هر دو حالت ممکن است. یک منوی مشترک برای همه شعبه‌ها، منوی کاملاً مستقل برای هر شعبه، یا یک منوی پایه با تفاوت‌های هر شعبه انتخاب می‌کنید. مشتری می‌تواند شعبه را دستی انتخاب کند، نزدیک‌ترین شعبه را ببیند یا از QR همان شعبه وارد شود." },
  { q: "سفارش آنلاین چطور به شعبه می‌رسد؟", a: "سفارش مستقیماً با نام شعبه، نوع دریافت، شماره میز، اقلام و اطلاعات تماس وارد صندوق سفارش همان کسب‌وکار می‌شود. کارکنان آن را تأیید می‌کنند، در حال آماده‌سازی و آماده تحویل می‌زنند و فقط برای هماهنگی همان سفارش می‌توانند با مشتری تماس بگیرند. اعلان داخل پنل و مرورگر پیش‌فرض است و ایمیل یا پیامک هم قابل فعال‌سازی است." },
];

const QA_EN = [
  { q: "What is a digital menu?", a: "A digital menu is the online, interactive version of your menu that guests open by scanning a QR code or following a link: photos, descriptions, current prices and search. Unlike a photo or PDF, it stays updatable and gives you view analytics." },
  { q: "How much does a digital menu cost?", a: "Basic menus start at 1,800,000 Toman. Bilingual versions, an admin panel and full ordering cost extra. Configure your options in the builder to see an instant estimate." },
  { q: "How does the QR menu work?", a: "We generate a unique QR per table (or branch). Guests scan it and the menu opens with the table ID attached; with ordering enabled, the table number attaches to the order automatically." },
  { q: "Does a digital menu need a domain?", a: "No. The default address is menu.foryxo.com/menus/{your-business}/menu. If you want a custom domain (like menu.cafe.ir), we provide complete DNS instructions and handle connection and SSL." },
  { q: "How is a bilingual menu built for tourists?", a: "Choose Persian + English in the languages step. Every item, description and category has both versions, and guests switch with one button — page direction adjusts automatically." },
  { q: "PDF menu vs online menu — what's the difference?", a: "A PDF isn't searchable, is painful to update, heavy to load and reads poorly on phones. An online menu is always current, mobile-designed, searchable, and gives you analytics on views and bestsellers." },
  { q: "How do we update our prices?", a: "In self-managed mode you edit prices in the menu editor and they apply immediately. In managed mode you submit a request; simple changes are usually free or low-cost." },
  { q: "Can guests order from inside the menu?", a: "Yes, optionally. Orders can go to WhatsApp or Telegram, or run as full in-menu ordering with cart, modifiers and online payment. Each business chooses its own mode." },
  { q: "Do multiple branches share one menu or have separate menus?", a: "Either is supported. Choose one shared menu, a completely independent menu per branch, or a shared base with branch-specific differences. Guests can choose manually, get a nearest-branch suggestion, or enter through a branch-specific QR." },
  { q: "How does an online order reach the right branch?", a: "The order arrives in the business order inbox with its branch, fulfillment type, table, items and customer contact details. Staff can accept, prepare, mark ready and complete it, and contact the guest only to coordinate that order. Dashboard and browser alerts are the reliable default; email or SMS can also be configured." },
];

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  const qa = fa ? QA_FA : QA_EN;

  return (
    <PageShell locale={l}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(qa)) }} />
      <section className="mx-auto max-w-3xl px-4 pb-20 pt-12">
        <h1 className="display-1">{t.faq.title}</h1>
        <p className="lede mt-3">{t.faq.subtitle}</p>
        <div className="mt-10 space-y-3">
          {qa.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-line bg-elevated p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold marker:hidden">
                <span>{f.q}</span>
                <ChevronDown className="size-5 shrink-0 accent-text transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-sm leading-7 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
