import type { Metadata } from "next";
import Link from "next/link";
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
  return { title: t.nav.howItWorks, description: t.home.processSubtitle, alternates: alternatesFor(l, "/how-it-works") };
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);

  const steps = [
    { title: t.home.processSteps.s1, body: t.home.processSteps.s1d },
    { title: t.home.processSteps.s2, body: t.home.processSteps.s2d },
    { title: t.home.processSteps.s3, body: t.home.processSteps.s3d },
    { title: t.home.processSteps.s4, body: t.home.processSteps.s4d },
    { title: t.home.processSteps.s5, body: t.home.processSteps.s5d },
  ];

  const modes = fa
    ? [
        { title: "مدیریت توسط فوریکسو", body: "هیچ زحمتی ندارید؛ تغییرات را از پنل «درخواست‌ها» بفرستید، استعلام هزینه را تأیید کنید و تیم ما در سریع‌ترین زمان انجام می‌دهد." },
        { title: "خودمدیریتی", body: "دسترسی ویرایشگر منو دریافت می‌کنید: آیتم، قیمت، عکس، موجودی و ترجمه‌ها را خودتان تغییر دهید؛ هر تغییر قبل از انتشار تأیید می‌شود." },
        { title: "ترکیبی", body: "کارهای روزمره را خودتان انجام دهید؛ طراحی، دامنه و امکانات جدید را به ما بسپارید." },
      ]
    : [
        { title: "Foryxo managed", body: "Zero effort: submit changes via Requests, approve the quote, and our team delivers fast." },
        { title: "Self-managed", body: "You get menu-editor access: items, prices, photos, availability, translations — with review before publish." },
        { title: "Hybrid", body: "Handle everyday content yourself; leave design, domains and new features to us." },
      ];

  return (
    <PageShell locale={l}>
      <section className="mx-auto max-w-4xl px-4 pb-20 pt-12">
        <h1 className="display-1">{t.nav.howItWorks}</h1>
        <p className="lede mt-3">{t.home.processSubtitle}</p>

        <ol className="mt-12 space-y-6">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-5">
              <div className="flex flex-col items-center">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl accent-bg text-base font-black">
                  {fa ? ["۱", "۲", "۳", "۴", "۵"][i] : i + 1}
                </span>
                {i < steps.length - 1 ? <span className="mt-1 w-px flex-1 bg-[var(--line)]" aria-hidden="true" /> : null}
              </div>
              <div className="pb-6">
                <h2 className="text-lg font-extrabold">{s.title}</h2>
                <p className="mt-1 leading-7 text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="display-2 mt-14">{fa ? "بعد از انتشار، منو چطور مدیریت می‌شود؟" : "How is the menu managed after launch?"}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {modes.map((m) => (
            <div key={m.title} className="surface rounded-2xl p-6">
              <h3 className="font-extrabold">{m.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{m.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-3xl accent-bg p-10 text-center">
          <h2 className="display-3 text-white">{fa ? "همین حالا شروع کنید" : "Start right now"}</h2>
          <Link
            href={`/${l}/build`}
            className="mt-6 inline-flex h-12 items-center rounded-xl bg-white px-8 text-sm font-extrabold text-[var(--accent)]"
          >
            {t.nav.startMenu}
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
