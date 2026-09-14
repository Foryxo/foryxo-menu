/**
 * Menu engine schema — the heart of the product.
 * Draft/published versioning; translations; modifiers; availability.
 */
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { businesses, branches } from "./business";

export const menus = pgTable(
  "menus",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    branchId: text("branch_id").references(() => branches.id),
    slug: text("slug").notNull(), // canonical public slug: /menus/{slug}/menu
    title: text("title").notNull(),
    titleEn: text("title_en"),
    description: text("description"),
    descriptionEn: text("description_en"),
    // draft | published | suspended
    status: text("status").notNull().default("draft"),
    publishedVersionId: text("published_version_id"),
    draftVersionId: text("draft_version_id"),
    locales: jsonb("locales").notNull(), // ["fa"] | ["fa","en"]
    themeId: text("theme_id"),
    indexable: boolean("indexable").notNull().default(false),
    // system | follow | light | dark
    colorMode: text("color_mode").notNull().default("system"),
    orderingEnabled: boolean("ordering_enabled").notNull().default(false),
    isDemo: boolean("is_demo").notNull().default(false),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("menu_slug_uq").on(t.slug),
    index("menu_biz_idx").on(t.businessId),
    index("menu_status_idx").on(t.status),
  ],
);

export const menuVersions = pgTable(
  "menu_versions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    menuId: text("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    label: text("label"),
    // draft | published | archived
    status: text("status").notNull().default("draft"),
    /** Full denormalized read-model snapshot (spec §86). Rebuilt on publish. */
    readModel: jsonb("read_model"),
    contentHash: text("content_hash"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("menu_version_uq").on(t.menuId, t.version),
    index("menu_version_status_idx").on(t.menuId, t.status),
  ],
);

export const menuLocales = pgTable(
  "menu_locales",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    menuId: text("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(), // fa | en | future
    isDefault: boolean("is_default").notNull().default(false),
  },
  (t) => [uniqueIndex("menu_locale_uq").on(t.menuId, t.locale)],
);

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    menuId: text("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    versionId: text("version_id")
      .notNull()
      .references(() => menuVersions.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    sort: integer("sort").notNull().default(0),
    isFeaturedSection: boolean("is_featured_section").notNull().default(false),
    daypartStart: text("daypart_start"), // "07:00" for scheduled sections
    daypartEnd: text("daypart_end"),
    icon: text("icon"),
  },
  (t) => [
    uniqueIndex("category_version_slug_uq").on(t.versionId, t.slug),
    index("category_version_sort_idx").on(t.versionId, t.sort),
  ],
);

export const categoryTranslations = pgTable(
  "category_translations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description"),
  },
  (t) => [uniqueIndex("cat_tr_uq").on(t.categoryId, t.locale)],
);

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    menuId: text("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    versionId: text("version_id")
      .notNull()
      .references(() => menuVersions.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    sort: integer("sort").notNull().default(0),
    /** Integer Toman. Spec §89 — never floating point, never Rial confusion. */
    price: integer("price").notNull(),
    priceOld: integer("price_old"),
    currency: text("currency").notNull().default("IRT"),
    isAvailable: boolean("is_available").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    isSoldOut: boolean("is_sold_out").notNull().default(false),
    isHidden: boolean("is_hidden").notNull().default(false),
    allowsCustomRequest: boolean("allows_custom_request")
      .notNull()
      .default(false), // Demo 10 feature
    badges: jsonb("badges"), // ["bestseller","new","spicy","chef"]
    nutrition: jsonb("nutrition"), // { kcal, protein, carbs, fat }
    allergens: jsonb("allergens"), // ["dairy","gluten","nuts"]
    dietary: jsonb("dietary"), // ["vegetarian","vegan","gluten_aware"]
    prepMinutes: integer("prep_minutes"),
    imageMediaId: text("image_media_id"),
    imagePrompt: text("image_prompt"), // per-product image generation brief
    searchText: text("search_text"), // normalized haystack updated on save
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("product_version_slug_uq").on(t.versionId, t.slug),
    index("product_version_cat_idx").on(t.versionId, t.categoryId, t.sort),
    index("product_menu_idx").on(t.menuId),
    index("product_search_idx").on(t.searchText),
  ],
);

export const productTranslations = pgTable(
  "product_translations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description"),
  },
  (t) => [uniqueIndex("product_tr_uq").on(t.productId, t.locale)],
);

export const productImages = pgTable(
  "product_images",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaId: text("media_id").notNull(),
    alt: text("alt"),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("product_img_idx").on(t.productId)],
);

export const modifierGroups = pgTable(
  "modifier_groups",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    menuId: text("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    versionId: text("version_id")
      .notNull()
      .references(() => menuVersions.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    minSelect: integer("min_select").notNull().default(0),
    maxSelect: integer("max_select").notNull().default(1),
    allowRepeat: boolean("allow_repeat").notNull().default(false),
    displayStyle: text("display_style").notNull().default("radio"), // radio | checkbox | stepper
    isRequired: boolean("is_required").notNull().default(false),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("mod_group_version_idx").on(t.versionId)],
);

export const modifierGroupTranslations = pgTable(
  "modifier_group_translations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    groupId: text("group_id")
      .notNull()
      .references(() => modifierGroups.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description"),
  },
  (t) => [uniqueIndex("mod_group_tr_uq").on(t.groupId, t.locale)],
);

export const modifiers = pgTable(
  "modifiers",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    groupId: text("group_id")
      .notNull()
      .references(() => modifierGroups.id, { onDelete: "cascade" }),
    priceDelta: integer("price_delta").notNull().default(0), // signed Toman
    isDefault: boolean("is_default").notNull().default(false),
    isAvailable: boolean("is_available").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    nestedGroupSlug: text("nested_group_slug"), // optional nested group by slug
  },
  (t) => [index("modifier_group_idx").on(t.groupId, t.sort)],
);

export const modifierTranslations = pgTable(
  "modifier_translations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    modifierId: text("modifier_id")
      .notNull()
      .references(() => modifiers.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
  },
  (t) => [uniqueIndex("modifier_tr_uq").on(t.modifierId, t.locale)],
);

export const productModifierGroups = pgTable(
  "product_modifier_groups",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    groupId: text("group_id")
      .notNull()
      .references(() => modifierGroups.id, { onDelete: "cascade" }),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [uniqueIndex("pmg_uq").on(t.productId, t.groupId)],
);

export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    menuId: text("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    // product | category | menu
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    timezone: text("timezone").notNull().default("Asia/Tehran"),
    daysOfWeek: jsonb("days_of_week"), // [0..6]
    startTime: text("start_time"), // "07:00"
    endTime: text("end_time"),
    startDate: text("start_date"), // ISO date for seasonal menus
    endDate: text("end_date"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [index("avail_target_idx").on(t.targetType, t.targetId)],
);

export const menuThemes = pgTable("menu_themes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull(), // mora | volt | khesht | ... (demo) or business theme
  name: text("name").notNull(),
  tokens: jsonb("tokens").notNull(), // CSS custom property map, RTL-safe
  fontFamily: text("font_family"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const menuDomains = pgTable(
  "menu_domains",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    menuId: text("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(), // lowercase FQDN
    verificationToken: text("verification_token").notNull(),
    // pending | verified | failed
    verificationStatus: text("verification_status").notNull().default("pending"),
    sslStatus: text("ssl_status").notNull().default("pending"), // pending | active | failed
    isPrimary: boolean("is_primary").notNull().default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("menu_domain_uq").on(t.domain),
    index("menu_domain_menu_idx").on(t.menuId),
  ],
);

export const tables = pgTable(
  "tables",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    branchId: text("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    label: text("label").notNull(), // "12"
    publicToken: text("public_token").notNull(), // signed, non-guessable reference
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("table_token_uq").on(t.publicToken),
    uniqueIndex("table_branch_label_uq").on(t.branchId, t.label),
    index("table_branch_idx").on(t.branchId),
  ],
);

export const qrCodes = pgTable(
  "qr_codes",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    menuId: text("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    tableId: text("table_id").references(() => tables.id, { onDelete: "cascade" }),
    targetUrl: text("target_url").notNull(),
    sourceId: text("source_id").notNull(), // opaque analytics source
    scanCount: integer("scan_count").notNull().default(0),
    design: jsonb("design"), // QR designer options
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("qr_source_uq").on(t.sourceId),
    uniqueIndex("qr_menu_table_uq").on(t.menuId, t.tableId),
    index("qr_menu_idx").on(t.menuId),
  ],
);

export const discounts = pgTable(
  "discounts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    menuId: text("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    code: text("code"),
    kind: text("kind").notNull(), // percent | fixed
    value: integer("value").notNull(),
    productId: text("product_id"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [index("discount_menu_idx").on(t.menuId)],
);
