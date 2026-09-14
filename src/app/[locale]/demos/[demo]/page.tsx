import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { DemoPhone } from "@/components/site/demo-phone";
import { demos, getDemo, demoProductCount } from "@/content/demos/index";
import { featureByKey } from "@/content/features";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { alternatesFor } from "@/domains/seo/hreflang";
import { CulinaryScene } from "@/components/three/culinary-scene";

export const dynamicParams = false;

export function generateStaticParams() {
  return ["fa", "en"].flatMap((locale) => demos.map((demo) => ({ locale, demo: demo.id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; demo: string }>;
}): Promise<Metadata> {
  const { locale, demo } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const d = getDemo(demo);
  if (!d) return {};
  const name = l === "fa" ? d.nameFa : d.name;
  return {
    title: `${name} — ${l === "fa" ? "دمو" : "demo"}`,
    description: l === "fa" ? d.tagline.fa : d.tagline.en,
    alternates: alternatesFor(l, `/demos/${demo}`),
  };
}

export default async function DemoDetailPage({
  params,
}: {
  params: Promise<{ locale: string; demo: string }>;
}) {
  const { locale, demo } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const d = getDemo(demo);
  if (!d) notFound();
  const t = getDictionary(l);

  return (
    <PageShell locale={l}>
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-10">
        <nav aria-label="breadcrumb" className="mb-6 text-sm text-muted">
          <Link href={`/${l}/demos`} className="hover:text-fg">
            {t.demos.title}
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="font-semibold text-fg">{fa ? d.nameFa : d.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
          {/* Live preview */}
          <div>
            <DemoPhone demo={d} locale={l} />
            <p className="mt-4 text-center text-xs text-muted">
              {fa
                ? "پیش‌نمایش تعاملی زنده — دسته‌ها را عوض کنید"
                : "Interactive live preview — switch categories"}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/menus/${d.id}/menu?lang=${l}`}
                className="flex h-12 items-center justify-center rounded-xl accent-bg text-sm font-bold transition-transform hover:-translate-y-0.5"
              >
                {fa ? "باز کردن منوی کامل" : "Open full live menu"}
              </Link>
              <Link
                href={`/${l}/build?demo=${d.id}`}
                className="flex h-12 items-center justify-center rounded-xl border border-[var(--accent)] text-sm font-bold accent-text hover:bg-[var(--accent-soft)]"
              >
                {t.common.chooseDesign}
              </Link>
              <Link
                href={`/${l}/demos`}
                className="flex h-11 items-center justify-center rounded-xl border border-line text-sm font-semibold hover:bg-subtle"
              >
                {t.common.back}
              </Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="mb-6 overflow-hidden rounded-3xl border border-line bg-[radial-gradient(circle_at_50%_30%,var(--accent-soft),transparent_72%)]">
              <CulinaryScene variant="demo" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wide accent-text">
              {t.common.demo} · {t.demos.openLive}
            </p>
            <h1 className="display-1 mt-1">
              {fa ? d.nameFa : d.name}
              <span className="ms-3 text-2xl font-semibold text-muted">{fa ? d.name : d.nameFa}</span>
            </h1>
            <p className="lede mt-4">{fa ? d.tagline.fa : d.tagline.en}</p>

            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-bold">{t.demos.bestFor}</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {(fa ? d.bestFor.fa : d.bestFor.en).map((b) => (
                    <span key={b} className="rounded-full bg-subtle px-3 py-1 text-xs font-semibold text-muted">
                      {b}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-bold">{t.demos.itemsCount}</dt>
                <dd className="mt-2 text-sm text-muted">
                  {demoProductCount(d)} · {d.categories.length} {t.demos.categoriesCount}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-bold">{t.demos.characteristics}</dt>
                <dd className="mt-2">
                  <ul className="space-y-1.5">
                    {(fa ? d.characteristics.fa : d.characteristics.en).map((c) => (
                      <li key={c} className="flex items-start gap-2 text-sm text-muted">
                        <span aria-hidden="true" className="mt-1 text-emerald-500">✓</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-bold">{t.demos.supportedFeatures}</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {d.supportedFeatures.map((f) => {
                    const def = featureByKey(f);
                    if (!def) return null;
                    return (
                      <span key={f} className="rounded-full border border-line px-3 py-1 text-xs font-semibold">
                        {fa ? def.fa : def.en}
                      </span>
                    );
                  })}
                </dd>
              </div>
            </dl>

            {/* Menu structure preview */}
            <div className="mt-10">
              <h2 className="display-3">{fa ? "ساختار منو" : "Menu structure"}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {d.categories.map((c) => (
                  <div key={c.slug} className="surface-subtle rounded-2xl p-4">
                    <h3 className="text-sm font-extrabold">{fa ? c.name.fa : c.name.en}</h3>
                    <p className="mt-1 text-xs text-muted">
                      {c.products.map((p) => (fa ? p.name.fa : p.name.en)).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
