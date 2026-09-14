import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { features } from "@/content/features";
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
  return { title: t.nav.features, description: t.home.heroSubtitle, alternates: alternatesFor(l, "/features") };
}

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);

  const priceLabel = (priceKey: string | null) => {
    if (!priceKey) return fa ? "شامل همه طرح‌ها" : "Included in every design";
    const p = CATALOG.find((c) => c.key === priceKey);
    if (!p) return t.build.featuresQuote;
    return formatToman(p.default, l);
  };

  return (
    <PageShell locale={l}>
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-12">
        <h1 className="display-1">{t.nav.features}</h1>
        <p className="lede mt-3 max-w-2xl">
          {fa
            ? "هر منو با یک سری امکانات پایه ساخته می‌شود و امکانات تکمیلی را در سازنده منو انتخاب می‌کنید."
            : "Every menu ships with a set of core capabilities; add the rest in the builder."}
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.key} className="surface flex flex-col rounded-2xl p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-extrabold">{fa ? f.fa : f.en}</h2>
                {f.recommended ? (
                  <span className="rounded-full accent-soft-bg px-2 py-0.5 text-[10px] font-bold accent-text">
                    {t.build.recommended}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">{fa ? f.faDesc : f.enDesc}</p>
              <p className="mt-3 text-xs font-bold accent-text">{priceLabel(f.priceKey)}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-3xl bg-elevated p-8 text-center shadow-[var(--shadow-card)]">
          <h2 className="display-3">{fa ? "ترکیب دلخواه‌تان را بسازید" : "Compose your own combination"}</h2>
          <Link
            href={`/${l}/build`}
            className="mt-6 inline-flex h-12 items-center rounded-xl accent-bg px-8 text-sm font-bold"
          >
            {t.nav.startMenu}
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
