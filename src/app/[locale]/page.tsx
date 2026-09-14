import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { DemoShowcase } from "@/components/site/showcase";
import { demos } from "@/content/demos/index";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { alternatesFor } from "@/domains/seo/hreflang";
import { buildFaqJsonLd, buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/domains/seo/jsonld";
import { CulinaryScene } from "@/components/three/culinary-scene";
import { ArrowUpRight, Check, ChevronDown, Languages, QrCode, ScanLine, Sparkles, Timer, X } from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  return {
    title: l === "fa" ? "منوی دیجیتال حرفه‌ای برای کافه و رستوران" : "Professional digital menus for cafés & restaurants",
    description: t.home.heroSubtitle,
    alternates: alternatesFor(l, ""),
    openGraph: { title: t.home.heroTitle, description: t.home.heroSubtitle, type: "website" },
  };
}

const FAQ_ITEMS_FA = [
  { q: "منوی دیجیتال چیست؟", a: "منوی دیجیتال نسخه آنلاین منوی رستوران شماست که مشتری با اسکن QR یا باز کردن لینک آن را روی گوشی می‌بیند؛ همیشه به‌روز، قابل جستجو و همراه با عکس و توضیح هر آیتم." },
  { q: "قیمت طراحی منوی دیجیتال چقدر است؟", a: "بسته به نوع کسب‌وکار، زبان‌ها و امکانات موردنیاز متفاوت است؛ منوی پایه از ۱٬۸۰۰٬۰۰۰ تومان شروع می‌شود. در صفحه تعرفه‌ها جزئیات کامل آمده و برآورد دقیق را در سازنده منو می‌بینید." },
  { q: "آیا منوی دیجیتال به دامنه اختصاصی نیاز دارد؟", a: "خیر. منوی شما به‌صورت پیش‌فرض روی menu.foryxo.com/menus/{نام شما}/menu فعال می‌شود. در صورت تمایل می‌توانید دامنه اختصاصی مثل menu.cafe-name.ir متصل کنید." },
  { q: "مشتری برای دیدن منو باید اپلیکیشن نصب کند یا ثبت‌نام کند؟", a: "هرگز. کافی است QR را اسکن کند تا منو فوراً باز شود؛ بدون نصب اپ، بدون ثبت‌نام و بدون انتظار." },
  { q: "چگونه قیمت‌ها و آیتم‌ها را به‌روز کنیم؟", a: "بسته به حالت مدیریت انتخابی: در حالت مدیریت فوریکسو، تغییرات را از پنل «درخواست‌ها» ثبت می‌کنید و تیم ما انجام می‌دهد؛ در حالت خودمدیریتی مستقیماً از ویرایشگر منو تغییر می‌دهید." },
];

const FAQ_ITEMS_EN = [
  { q: "What is a digital menu?", a: "A digital menu is the online version of your restaurant menu that guests open by scanning a QR code or following a link — always current, searchable, with photos and descriptions per item." },
  { q: "How much does a digital menu cost?", a: "It depends on business type, languages and features; basic menus start at 1,800,000 Toman. See the pricing page for details, or configure your menu for an instant estimate." },
  { q: "Does a digital menu need a custom domain?", a: "No. Your menu goes live at menu.foryxo.com/menus/{your-name}/menu by default. You can optionally connect a custom domain like menu.cafe-name.ir." },
  { q: "Do guests need to install an app or sign up?", a: "Never. Scanning the QR opens the menu instantly — no app, no signup, no waiting." },
  { q: "How do we update prices and items?", a: "Depending on your management mode: in Foryxo-managed mode you submit changes via the Requests panel and our team applies them; in self-managed mode you edit directly in the menu editor." },
];

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  const fa = l === "fa";

  const steps = [
    { title: t.home.processSteps.s1, body: t.home.processSteps.s1d },
    { title: t.home.processSteps.s2, body: t.home.processSteps.s2d },
    { title: t.home.processSteps.s3, body: t.home.processSteps.s3d },
    { title: t.home.processSteps.s4, body: t.home.processSteps.s4d },
    { title: t.home.processSteps.s5, body: t.home.processSteps.s5d },
  ];
  const faqs = fa ? FAQ_ITEMS_FA : FAQ_ITEMS_EN;

  return (
    <PageShell locale={l}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(faqs)) }} />

      {/* ---------- Hero + live showcase ---------- */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 50% -10%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%)",
          }}
        />
        <div className="premium-grid pointer-events-none absolute inset-0 -z-10 opacity-55" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-10 px-4 pb-16 pt-14 md:grid-cols-2 md:pt-20">
          <div className="min-w-0">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-elevated px-3 py-1 text-xs font-semibold text-muted">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {t.common.brandTagline}
            </p>
            <h1 className="display-1 max-w-[12ch]">{t.home.heroTitle}</h1>
            <p className="lede mt-5 max-w-lg">{t.home.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={`/${l}/demos`}
                className="inline-flex h-12 items-center rounded-xl accent-bg px-7 text-sm font-bold shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-pop)] active:translate-y-0 active:scale-95"
              >
                {t.home.heroCtaPrimary}
              </Link>
              <Link
                href={`/${l}/build`}
                className="inline-flex h-12 items-center rounded-xl border border-line bg-elevated px-7 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)] hover:bg-subtle hover:shadow-[var(--shadow-card)] active:translate-y-0"
              >
                {t.home.heroCtaSecondary}
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted">{t.home.heroNote}</p>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted">
              {[
                fa ? "QR دائمی رایگان" : "Permanent QR included",
                fa ? "فارسی، انگلیسی و بیشتر" : "Persian, English & more",
                fa ? "بدون نصب اپ" : "No app required",
              ].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" aria-hidden="true" />{item}</span>)}
            </div>
          </div>
          <div className="relative min-w-0">
            <div className="pointer-events-none absolute inset-x-[-10%] top-[-18%] z-0 opacity-45 blur-[0.2px] dark:opacity-35">
              <CulinaryScene />
            </div>
            <div className="relative z-10 pt-20 md:pt-28">
              <DemoShowcase demos={demos} locale={l} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Value bento ---------- */}
      <section className="scroll-reveal pb-20 pt-4">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-extrabold accent-text">{fa ? "بیشتر از یک فایل PDF" : "More than a PDF"}</p>
              <h2 className="display-2 mt-2 max-w-2xl">{fa ? "منویی که واقعاً با مهمان شما کار می‌کند" : "A menu that actually works with your guests"}</h2>
            </div>
            <Link href={`/${l}/features`} className="group inline-flex items-center gap-2 text-sm font-bold accent-text">{fa ? "همه امکانات" : "Explore every feature"}<ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></Link>
          </div>
          <div className="grid gap-4 md:grid-cols-6">
            <article className="aurora-card surface interactive-lift min-h-72 rounded-3xl p-7 md:col-span-4">
              <div className="grid size-12 place-items-center rounded-2xl accent-bg"><ScanLine className="size-6" aria-hidden="true" /></div>
              <h3 className="mt-10 text-2xl font-black">{fa ? "اسکن تا منو، در یک لحظه" : "Scan to menu, in a moment"}</h3>
              <p className="mt-3 max-w-xl leading-7 text-muted">{fa ? "یک QR اصلی برای ورودی و شبکه‌های اجتماعی کافی است. اگر سفارش یا درخواست گارسون باید شماره میز را بداند، برای هر میز QR اختصاصی می‌سازیم." : "One main QR works for entrances and social profiles. If ordering or waiter calls need table context, we generate a permanent code for each table."}</p>
              <code className="mt-7 block w-fit rounded-xl border border-line bg-subtle px-4 py-3 text-xs" dir="ltr">menu.foryxo.com/menus/your-cafe/menu</code>
            </article>
            <article className="surface interactive-lift rounded-3xl p-7 md:col-span-2">
              <Languages className="size-7 accent-text" aria-hidden="true" />
              <h3 className="mt-8 text-xl font-black">{fa ? "چندزبانه واقعی" : "Truly multilingual"}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{fa ? "ترجمه جداگانه نام، توضیح و دسته‌بندی با چیدمان صحیح RTL و LTR؛ هر زبان اضافه قیمت شفاف خودش را دارد." : "Translated item names, descriptions and categories with correct RTL/LTR layout. Every added language is priced transparently."}</p>
            </article>
            <article className="surface interactive-lift rounded-3xl p-7 md:col-span-2">
              <Timer className="size-7 accent-text" aria-hidden="true" />
              <h3 className="mt-8 text-xl font-black">{fa ? "همیشه به‌روز" : "Always current"}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{fa ? "قیمت، موجودی و ساعت سرو را بدون چاپ دوباره تغییر دهید؛ خودتان یا با درخواست از تیم ما." : "Change prices, availability and service hours without reprinting—yourself or through our managed service."}</p>
            </article>
            <article className="surface interactive-lift rounded-3xl p-7 md:col-span-4">
              <div className="flex items-start justify-between gap-6">
                <div><Sparkles className="size-7 accent-text" aria-hidden="true" /><h3 className="mt-8 text-xl font-black">{fa ? "قالب، نقطه شروع است؛ نه محدودیت" : "A template is a starting point, not a limit"}</h3><p className="mt-3 max-w-xl text-sm leading-7 text-muted">{fa ? "یکی از دموها را انتخاب کنید یا طراحی اختصاصی بخواهید. رنگ، تایپوگرافی، حرکت و ساختار با هویت برند شما هماهنگ می‌شود." : "Choose a demo or request a bespoke direction. Color, typography, motion and structure are tuned to your brand."}</p></div>
                <div className="hidden shrink-0 rounded-2xl accent-soft-bg p-5 sm:block"><QrCode className="size-16 accent-text" aria-hidden="true" /></div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- Process ---------- */}
      <section className="scroll-reveal border-y border-line bg-elevated py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="display-2">{t.home.processTitle}</h2>
          <p className="lede mt-2">{t.home.processSubtitle}</p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5" role="list">
            {steps.map((s, i) => (
              <li key={s.title} className="motion-surface relative rounded-2xl border border-transparent bg-subtle p-5 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--accent)_22%,var(--line))] hover:shadow-[var(--shadow-card)]">
                <span className="mb-3 inline-grid size-9 place-items-center rounded-xl accent-bg text-sm font-black">
                  {fa ? ["۱", "۲", "۳", "۴", "۵"][i] : i + 1}
                </span>
                <h3 className="font-bold">{s.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Before / after ---------- */}
      <section className="scroll-reveal py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="display-2">{t.home.beforeAfterTitle}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="motion-surface rounded-2xl border border-dashed border-line p-7 hover:-translate-y-1">
              <h3 className="text-lg font-bold text-muted">{t.home.beforeLabel}</h3>
              <ul className="mt-4 space-y-3">
                {t.home.beforePoints.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted">
                    <X aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-red-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="motion-surface rounded-2xl border border-line bg-elevated p-7 shadow-[var(--shadow-card)] hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]">
              <h3 className="text-lg font-bold accent-text">{t.home.afterLabel}</h3>
              <ul className="mt-4 space-y-3">
                {t.home.afterPoints.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm">
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Pricing teaser ---------- */}
      <section className="scroll-reveal border-y border-line bg-elevated py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="display-2">{t.home.pricingTeaserTitle}</h2>
            <p className="mt-2 text-sm text-muted">
              {fa ? "منوی پایه از ۱٬۸۰۰٬۰۰۰ تومان · هاستینگ سالانه از ۶۰۰٬۰۰۰ تومان" : "Basic menu from 1.8M Toman · annual hosting from 600K Toman"}
              {" · "}
              {t.common.domainNote}
            </p>
          </div>
          <Link
            href={`/${l}/pricing`}
            className="inline-flex h-12 shrink-0 items-center rounded-xl accent-bg px-7 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-pop)] active:translate-y-0"
          >
            {t.home.pricingTeaserCta}
          </Link>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="scroll-reveal py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="display-2">{t.home.faqTitle}</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-elevated p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold marker:hidden">
                  <span>{f.q}</span>
                  <ChevronDown className="size-5 shrink-0 accent-text transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="scroll-reveal pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-3xl accent-bg px-8 py-14 text-center" style={{ background: "linear-gradient(120deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #000))" }}>
            <h2 className="display-2 text-white">{t.home.finalCtaTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">{t.home.finalCtaBody}</p>
            <Link
              href={`/${l}/build`}
              className="mt-8 inline-flex h-12 items-center rounded-xl bg-white px-8 text-sm font-extrabold text-[var(--accent)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_16px_36px_-18px_rgb(0_0_0/0.55)] active:translate-y-0 active:scale-95"
            >
              {t.home.finalCtaButton}
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
