/**
 * Canonical live menu page — /menus/{slug}/menu.
 * Read-model driven; cacheable; no auth; SEO metadata + JSON-LD.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedReadModel } from "@/domains/menu-engine/publish";
import { MenuApp } from "@/domains/menu-engine/renderer";
import { buildRestaurantJsonLd } from "@/domains/seo/jsonld";
import { getDb } from "@/domains/db/client";
import { branches, menus, tables } from "@/domains/db/schema/index";
import { and, asc, eq } from "drizzle-orm";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string; src?: string; lang?: string; branch?: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const model = await getPublishedReadModel(slug);
  if (!model) notFound();
  const title = `${model.title} | ${model.titleEn ?? "Menu"}`;
  const description = model.description ?? model.descriptionEn ?? `${model.title} menu with prices and photos`;

  return {
    title,
    description,
    alternates: { canonical: `https://menu.foryxo.com/menus/${slug}/menu` },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fa_IR",
      alternateLocale: "en_US",
      url: `https://menu.foryxo.com/menus/${slug}/menu`,
    },
  };
}

export default async function MenuPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const input = await searchParams;
  const model = await getPublishedReadModel(slug);
  if (!model) notFound();
  const requestedTableToken = input.table?.slice(0, 80) ?? null;
  let tableToken: string | null = null;
  let tableLabel: string | null = null;
  const lang = input.lang === "en" ? "en" : "fa";
  const jsonLd = buildRestaurantJsonLd(model);
  let branchContext: {
    selectedBranchId: string | null;
    options: { id: string; name: string; address: string | null; phone: string | null; url: string; acceptsOrders: boolean; fulfillmentTypes: string[]; minimumOrder: number }[];
  } = { selectedBranchId: null, options: [] };
  try {
    const db = getDb();
    const [menuRow] = await db.select().from(menus).where(and(eq(menus.slug, slug), eq(menus.status, "published"))).limit(1);
    if (menuRow) {
      const [branchRows, menuRows] = await Promise.all([
        db.select().from(branches).where(and(eq(branches.businessId, menuRow.businessId), eq(branches.isActive, true))).orderBy(asc(branches.createdAt)),
        db.select().from(menus).where(and(eq(menus.businessId, menuRow.businessId), eq(menus.status, "published"))),
      ]);
      const sharedMenu = menuRows.find((candidate) => !candidate.branchId);
      const options = branchRows.flatMap((branch) => {
        const uniqueMenu = menuRows.find((candidate) => candidate.branchId === branch.id);
        const targetMenu = uniqueMenu ?? sharedMenu ?? (menuRow.branchId === branch.id ? menuRow : null);
        if (!targetMenu) return [];
        return [{
          id: branch.id,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          url: targetMenu.branchId ? `/menus/${targetMenu.slug}/menu` : `/menus/${targetMenu.slug}/menu?branch=${encodeURIComponent(branch.slug)}`,
          acceptsOrders: branch.acceptsOrders,
          fulfillmentTypes: Array.isArray(branch.fulfillmentTypes) ? branch.fulfillmentTypes as string[] : [],
          minimumOrder: branch.minimumOrder,
        }];
      });
      const availableIds = new Set(options.map((option) => option.id));
      const selected = branchRows.find((branch) => branch.id === menuRow.branchId && availableIds.has(branch.id))
        ?? branchRows.find((branch) => branch.slug === input.branch && availableIds.has(branch.id))
        ?? branchRows.find((branch) => branch.isPrimary && availableIds.has(branch.id))
        ?? branchRows.find((branch) => availableIds.has(branch.id));
      if (requestedTableToken && selected) {
        const [table] = await db.select().from(tables).where(and(eq(tables.publicToken, requestedTableToken), eq(tables.branchId, selected.id), eq(tables.isActive, true))).limit(1);
        if (table) { tableToken = table.publicToken; tableLabel = table.label; }
      }
      branchContext = {
        selectedBranchId: selected?.id ?? null,
        options,
      };
    }
  } catch { /* Bundled demos and database maintenance gracefully use a branchless menu. */ }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <noscript>
        <div style={{ padding: 16, fontFamily: "sans-serif" }}>
          <h1>{model.title}</h1>
          {model.categories.map((category) => (
            <section key={category.id}>
              <h2>{category.name}</h2>
              <ul>
                {category.products.map((product) => <li key={product.id}>{product.name} — {product.price}</li>)}
              </ul>
            </section>
          ))}
        </div>
      </noscript>
      <MenuApp model={model} initialLocale={lang} tableNumber={tableLabel} tableToken={tableToken} branchContext={branchContext} />
    </>
  );
}
