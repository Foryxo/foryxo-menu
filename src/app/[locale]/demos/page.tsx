import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { PageShell } from "@/components/site/page-shell";
import { DemoPhone } from "@/components/site/demo-phone";
import { demos, demoProductCount } from "@/content/demos/index";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { alternatesFor } from "@/domains/seo/hreflang";
import { getDb } from "@/domains/db/client";
import { managedDemos } from "@/domains/db/schema/index";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  return {
    title: t.demos.title,
    description: t.demos.subtitle,
    alternates: alternatesFor(l, "/demos"),
  };
}

export default async function DemosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  const fa = l === "fa";
  let uploaded: typeof managedDemos.$inferSelect[] = [];
  try {
    uploaded = await getDb().select().from(managedDemos).where(eq(managedDemos.status, "published")).orderBy(asc(managedDemos.sort));
  } catch {
    // Managed content is optional during a fresh build before migrations run.
  }

  return (
    <PageShell locale={l}>
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-12">
        <h1 className="display-1">{t.demos.title}</h1>
        <p className="lede mt-3 max-w-2xl">{t.demos.subtitle}</p>

        <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((d) => (
            <article key={d.id} className="group flex flex-col">
              <div className="transition-transform duration-300 group-hover:-translate-y-1">
                <DemoPhone demo={d} locale={l} />
              </div>
              <div className="mt-4 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-extrabold">{fa ? d.nameFa : d.name}</h2>
                  <span className="text-xs text-muted">
                    {d.categories.length} {t.demos.categoriesCount} · {demoProductCount(d)} {t.demos.itemsCount}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{fa ? d.tagline.fa : d.tagline.en}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(fa ? d.bestFor.fa : d.bestFor.en).slice(0, 3).map((b) => (
                    <span key={b} className="rounded-full bg-subtle px-2.5 py-0.5 text-xs font-semibold text-muted">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href={`/menus/${d.id}/menu?lang=${l}`}
                  className="col-span-2 flex h-11 items-center justify-center rounded-xl accent-bg text-sm font-bold transition-transform hover:-translate-y-0.5"
                >
                  {fa ? "باز کردن منوی کامل" : "Open full live menu"}
                </Link>
                <Link
                  href={`/${l}/demos/${d.id}`}
                  className="flex h-10 flex-1 items-center justify-center rounded-xl border border-line text-sm font-bold hover:bg-subtle"
                >
                  {fa ? "جزئیات و پیش‌نمایش" : "Details & preview"}
                </Link>
                <Link
                  href={`/${l}/build?demo=${d.id}`}
                  className="flex h-10 flex-1 items-center justify-center rounded-xl accent-bg text-sm font-bold"
                >
                  {t.common.chooseDesign}
                </Link>
              </div>
            </article>
          ))}
          {uploaded.map((d) => (
            <article key={d.id} className="interactive-lift group flex flex-col overflow-hidden rounded-3xl border border-line bg-elevated">
              <div className="relative aspect-[4/3] overflow-hidden bg-subtle">
                <Image src={d.previewImageUrl} alt={fa ? d.titleFa : d.titleEn} fill unoptimized={d.previewImageUrl.startsWith("http")} sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-bold accent-text">{fa ? "دموی جدید" : "Managed demo"}</p>
                <h2 className="mt-2 text-lg font-extrabold">{fa ? d.titleFa : d.titleEn}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted">{fa ? d.descriptionFa : d.descriptionEn}</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link href={d.liveMenuUrl} className="col-span-2 flex h-11 items-center justify-center rounded-xl accent-bg text-sm font-bold">{fa ? "باز کردن منوی زنده" : "Open live menu"}</Link>
                  <Link href={`/${l}/build?demo=${d.slug}`} className="col-span-2 flex h-10 items-center justify-center rounded-xl border border-line text-sm font-bold hover:bg-subtle">{t.common.chooseDesign}</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
