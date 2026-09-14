/**
 * Publish pipeline (spec §39, §82): validate → snapshot read-model → publish.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import {
  menus,
  menuVersions,
  categories,
  categoryTranslations,
  products,
  productTranslations,
  productImages,
  modifierGroups,
  modifierGroupTranslations,
  modifiers,
  modifierTranslations,
  productModifierGroups,
  businesses,
  branches,
  businessSettings,
} from "@/domains/db/schema/index";
import type { MenuReadModel } from "./read-model";
import { createHash } from "node:crypto";
import { getDemo, type DemoDefinition } from "@content/demos/index";

export interface PublishValidation {
  ok: boolean;
  blockers: string[];
  warnings: string[];
}

/** Pre-publish validation (spec §82). */
export async function validateMenuForPublish(menuId: string): Promise<PublishValidation> {
  const db = getDb();
  const blockers: string[] = [];
  const warnings: string[] = [];

  const menu = (await db.select().from(menus).where(eq(menus.id, menuId)).limit(1))[0];
  if (!menu) {
    return { ok: false, blockers: ["menu_not_found"], warnings };
  }
  if (!menu.draftVersionId) {
    blockers.push("no_draft_version");
    return { ok: false, blockers, warnings };
  }
  const versionId = menu.draftVersionId;

  const cats = await db.select().from(categories).where(eq(categories.versionId, versionId));
  if (cats.length === 0) blockers.push("no_categories");

  const prods = await db.select().from(products).where(eq(products.versionId, versionId));
  if (prods.length === 0) blockers.push("no_products");

  // Business name required
  const biz = (await db.select().from(businesses).where(eq(businesses.id, menu.businessId)).limit(1))[0];
  if (!biz?.name) blockers.push("missing_business_name");

  // Price sanity: non-negative
  for (const p of prods) {
    if (p.price < 0) blockers.push(`negative_price:${p.slug}`);
  }

  // Warnings (non-blocking)
  const withImages = await db.select().from(productImages);
  const imgSet = new Set(withImages.map((i) => i.productId));
  for (const p of prods) {
    if (!imgSet.has(p.id) && !p.imagePrompt) warnings.push(`missing_image:${p.slug}`);
  }
  const trs = await db.select().from(productTranslations);
  const faNames = new Set(trs.filter((t) => t.locale === "fa").map((t) => t.productId));
  const faWithDesc = new Set(trs.filter((t) => t.locale === "fa" && t.description).map((t) => t.productId));
  for (const p of prods) {
    if (!faNames.has(p.id)) warnings.push(`missing_fa_translation:${p.slug}`);
    if (!faWithDesc.has(p.id)) warnings.push(`missing_description:${p.slug}`);
  }

  return { ok: blockers.length === 0, blockers, warnings };
}

/** Build the denormalized read model for a published version. */
export async function buildReadModel(menuId: string, versionId: string): Promise<MenuReadModel> {
  const db = getDb();
  const menu = (await db.select().from(menus).where(eq(menus.id, menuId)).limit(1))[0];
  const biz = (await db.select().from(businesses).where(eq(businesses.id, menu.businessId)).limit(1))[0];
  const settings = (await db.select().from(businessSettings).where(eq(businessSettings.businessId, biz.id)).limit(1))[0];
  const branch = menu.branchId
    ? (await db.select().from(branches).where(eq(branches.id, menu.branchId)).limit(1))[0]
    : undefined;

  const cats = await db.select().from(categories).where(eq(categories.versionId, versionId));
  const catTrs = await db.select().from(categoryTranslations);
  const prods = await db.select().from(products).where(eq(products.versionId, versionId));
  const prodTrs = await db.select().from(productTranslations);
  const imgs = await db.select().from(productImages);
  const groups = await db.select().from(modifierGroups).where(eq(modifierGroups.versionId, versionId));
  const groupTrs = await db.select().from(modifierGroupTranslations);
  const mods = await db.select().from(modifiers);
  const modTrs = await db.select().from(modifierTranslations);
  const pmgs = await db.select().from(productModifierGroups);

  const readCats = cats
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .map((c) => {
      const fa = catTrs.find((t) => t.categoryId === c.id && t.locale === "fa");
      const en = catTrs.find((t) => t.categoryId === c.id && t.locale === "en");
      const catProducts = prods
        .filter((p) => p.categoryId === c.id)
        .sort((a, b) => a.sort - b.sort)
        .map((p) => {
          const pFa = prodTrs.find((t) => t.productId === p.id && t.locale === "fa");
          const pEn = prodTrs.find((t) => t.productId === p.id && t.locale === "en");
          const img = imgs.find((i) => i.productId === p.id && i.sort === 0);
          const productGroupIds = pmgs
            .filter((x) => x.productId === p.id)
            .sort((a, b) => a.sort - b.sort);
          const pGroups = productGroupIds
            .map(({ groupId }) => {
              const g = groups.find((gr) => gr.id === groupId);
              if (!g) return null;
              const gFa = groupTrs.find((t) => t.groupId === g.id && t.locale === "fa");
              const gEn = groupTrs.find((t) => t.groupId === g.id && t.locale === "en");
              const options = mods
                .filter((m) => m.groupId === g.id)
                .sort((a, b) => a.sort - b.sort)
                .map((m) => {
                  const mFa = modTrs.find((t) => t.modifierId === m.id && t.locale === "fa");
                  const mEn = modTrs.find((t) => t.modifierId === m.id && t.locale === "en");
                  return {
                    id: m.id,
                    name: mFa?.name ?? mEn?.name ?? m.id,
                    nameEn: mEn?.name ?? null,
                    priceDelta: m.priceDelta,
                    isDefault: m.isDefault,
                    available: m.isAvailable,
                  };
                });
              return {
                id: g.id,
                slug: g.slug,
                name: gFa?.name ?? gEn?.name ?? g.slug,
                nameEn: gEn?.name ?? null,
                min: g.minSelect,
                max: g.maxSelect,
                required: g.isRequired,
                allowRepeat: g.allowRepeat,
                options,
              };
            })
            .filter(Boolean) as MenuReadModel["categories"][number]["products"][number]["modifierGroups"];

          return {
            id: p.id,
            slug: p.slug,
            categorySlug: c.slug,
            sort: p.sort,
            name: pFa?.name ?? pEn?.name ?? p.slug,
            nameEn: pEn?.name ?? null,
            description: pFa?.description ?? null,
            descriptionEn: pEn?.description ?? null,
            price: p.price,
            priceOld: p.priceOld ?? null,
            currency: p.currency,
            available: p.isAvailable,
            soldOut: p.isSoldOut,
            featured: p.isFeatured,
            hidden: p.isHidden,
            scheduledHide: false,
            badges: (p.badges as string[]) ?? [],
            nutrition: (p.nutrition as MenuReadModel["categories"][number]["products"][number]["nutrition"]) ?? null,
            allergens: (p.allergens as string[]) ?? [],
            dietary: (p.dietary as string[]) ?? [],
            allowsCustomRequest: p.allowsCustomRequest,
            imagePrompt: p.imagePrompt ?? null,
            imageUrl: img ? `/api/media/${img.mediaId}` : null,
            modifierGroups: pGroups,
          };
        });

      return {
        id: c.id,
        slug: c.slug,
        name: fa?.name ?? en?.name ?? c.slug,
        nameEn: en?.name ?? null,
        description: fa?.description ?? null,
        icon: c.icon ?? null,
        daypart: c.daypartStart && c.daypartEnd ? { start: c.daypartStart, end: c.daypartEnd } : null,
        products: catProducts,
      };
    });

  const model: MenuReadModel = {
    menuId,
    version: 0,
    slug: menu.slug,
    title: menu.title,
    titleEn: menu.titleEn ?? null,
    description: menu.description ?? null,
    descriptionEn: menu.descriptionEn ?? null,
    locales: (menu.locales as string[]) as MenuReadModel["locales"],
    theme: null, // theme resolved at render time from menuThemes by themeId
    business: {
      name: biz.name,
      nameEn: biz.nameEn ?? null,
      slug: biz.slug,
      businessType: biz.businessType,
      timezone: biz.timezone,
      currency: biz.currency,
      address: branch?.address ?? null,
      city: branch?.city ?? null,
      phone: branch?.phone ?? null,
      latitude: branch?.latitude ?? null,
      longitude: branch?.longitude ?? null,
      openingHours: branch?.openingHours ?? null,
      servesCuisine: settings?.servesCuisine ?? null,
      priceRange: settings?.priceRange ?? null,
      social: settings?.social ?? null,
    },
    categories: readCats,
    capabilities: { ordering: menu.orderingEnabled },
    builtAt: new Date().toISOString(),
    contentHash: "",
  };

  const hash = createHash("sha256")
    .update(JSON.stringify({ ...model, contentHash: "", builtAt: "" }))
    .digest("hex")
    .slice(0, 32);
  model.contentHash = hash;
  return model;
}

export interface PublishResult {
  ok: boolean;
  blockers?: string[];
  warnings?: string[];
  version?: number;
  readModelHash?: string;
}

/**
 * Publish the current draft version of a menu.
 * Server-authoritative; used by admin publish action and tests.
 */
export async function publishMenu(menuId: string, actorUserId: string): Promise<PublishResult> {
  const db = getDb();
  const validation = await validateMenuForPublish(menuId);
  if (!validation.ok) {
    return { ok: false, blockers: validation.blockers, warnings: validation.warnings };
  }

  const menu = (await db.select().from(menus).where(eq(menus.id, menuId)).limit(1))[0];
  const draftId = menu.draftVersionId!;
  const draft = (await db.select().from(menuVersions).where(eq(menuVersions.id, draftId)).limit(1))[0];

  const readModel = await buildReadModel(menuId, draftId);

  // Mark previous published version archived.
  if (menu.publishedVersionId) {
    await db
      .update(menuVersions)
      .set({ status: "archived" })
      .where(eq(menuVersions.id, menu.publishedVersionId));
  }

  await db
    .update(menuVersions)
    .set({ status: "published", readModel, contentHash: readModel.contentHash, publishedAt: new Date(), createdBy: actorUserId })
    .where(eq(menuVersions.id, draftId));

  await db
    .update(menus)
    .set({ status: "published", publishedVersionId: draftId, updatedAt: new Date() })
    .where(eq(menus.id, menuId));

  // Create a fresh draft version for ongoing edits (copy of published content happens lazily).
  const nextVersion = draft.version + 1;
  const [newDraft] = await db
    .insert(menuVersions)
    .values({ menuId, version: nextVersion, status: "draft" })
    .returning();
  await db.update(menus).set({ draftVersionId: newDraft.id }).where(eq(menus.id, menuId));

  return { ok: true, version: draft.version, readModelHash: readModel.contentHash, warnings: validation.warnings };
}

/** Fetch the published read model for a menu (single indexed query). */
export async function getPublishedReadModel(slug: string): Promise<MenuReadModel | null> {
  // Bundled demos are immutable content. Serving them without a database
  // round-trip keeps sample menus available during database maintenance.
  const bundledDemo = getDemo(slug);
  if (bundledDemo) return demoToReadModel(bundledDemo);

  const db = getDb();
  const menu = (
    await db
      .select()
      .from(menus)
      .where(and(eq(menus.slug, slug), eq(menus.status, "published")))
      .limit(1)
  )[0];
  if (!menu?.publishedVersionId) return null;
  const version = (
    await db.select().from(menuVersions).where(eq(menuVersions.id, menu.publishedVersionId)).limit(1)
  )[0];
  if (!version?.readModel) return null;
  return { ...(version.readModel as MenuReadModel), version: version.version };
}

function demoToReadModel(demo: DemoDefinition): MenuReadModel {
  return {
    menuId: `demo-${demo.id}`,
    version: 1,
    slug: demo.id,
    title: demo.nameFa,
    titleEn: demo.name,
    description: demo.tagline.fa,
    descriptionEn: demo.tagline.en,
    locales: ["fa", "en"],
    theme: { ...demo.theme, mode: demo.colorMode },
    business: {
      name: demo.nameFa,
      nameEn: demo.name,
      slug: demo.id,
      businessType: "restaurant",
      timezone: "Asia/Tehran",
      currency: "IRT",
      address: null,
      city: "Tehran",
      phone: null,
      latitude: null,
      longitude: null,
      openingHours: null,
      servesCuisine: null,
      priceRange: "$$",
      social: null,
    },
    categories: demo.categories.map((category, categoryIndex) => ({
      id: `demo-${demo.id}-category-${category.slug}`,
      slug: category.slug,
      name: category.name.fa,
      nameEn: category.name.en,
      description: category.description?.fa ?? null,
      icon: category.icon ?? null,
      daypart: category.daypart ?? null,
      products: category.products.map((product, productIndex) => ({
        id: `demo-${demo.id}-product-${product.slug}`,
        slug: product.slug,
        categorySlug: category.slug,
        sort: categoryIndex * 100 + productIndex,
        name: product.name.fa,
        nameEn: product.name.en,
        description: product.description.fa,
        descriptionEn: product.description.en,
        price: product.price,
        priceOld: product.priceOld ?? null,
        currency: "IRT",
        available: true,
        soldOut: false,
        featured: product.badges?.includes("bestseller") ?? false,
        hidden: false,
        scheduledHide: false,
        badges: product.badges ?? [],
        nutrition: product.nutrition ?? null,
        allergens: product.allergens ?? [],
        dietary: product.dietary ?? [],
        allowsCustomRequest: product.allowsCustomRequest ?? false,
        imagePrompt: product.imagePrompt,
        imageUrl: product.imageUrl ?? `/images/demos/${demo.id}/${category.slug}/${product.slug}.webp`,
        modifierGroups: (product.modifiers ?? []).map((group) => ({
          id: `demo-${demo.id}-modifier-${group.slug}`,
          slug: group.slug,
          name: group.name.fa,
          nameEn: group.name.en,
          min: group.min,
          max: group.max,
          required: group.required ?? false,
          allowRepeat: false,
          options: group.options.map((option) => ({
            id: `demo-${demo.id}-option-${group.slug}-${option.slug}`,
            name: option.name.fa,
            nameEn: option.name.en,
            priceDelta: option.delta,
            isDefault: option.default ?? false,
            available: true,
          })),
        })),
      })),
    })),
    capabilities: { ordering: false },
    builtAt: "2026-01-01T00:00:00.000Z",
    contentHash: `bundled-demo-${demo.id}-v1`,
  };
}
