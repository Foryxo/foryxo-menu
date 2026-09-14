/**
 * Service requests, messaging templates, notifications, media, content,
 * audit logs and operational tables.
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
import { businesses } from "./business";
import { user } from "./auth";

/* ------------------------ Service requests ----------------------- */

export const serviceRequests = pgTable(
  "service_requests",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id),
    projectId: text("project_id"),
    menuId: text("menu_id"),
    number: text("number").notNull(), // SR-1405-0042
    category: text("category").notNull(), // price_change | add_product | ...
    title: text("title").notNull(),
    body: text("body").notNull(),
    urgency: text("urgency").notNull().default("normal"), // normal | urgent
    preferredDate: text("preferred_date"),
    // open | quoted | quote_approved | in_progress | delivered | closed | rejected
    status: text("status").notNull().default("open"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("sr_number_uq").on(t.number),
    index("sr_biz_idx").on(t.businessId),
    index("sr_status_idx").on(t.status),
  ],
);

export const serviceRequestMessages = pgTable(
  "service_request_messages",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    requestId: text("request_id")
      .notNull()
      .references(() => serviceRequests.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").notNull(),
    body: text("body").notNull(),
    attachments: jsonb("attachments"), // [{ mediaId, url, filename, mime }]
    isInternal: boolean("is_internal").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sr_msg_request_idx").on(t.requestId)],
);

/* --------------------- Managed demo library --------------------- */

export const managedDemos = pgTable(
  "managed_demos",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    titleFa: text("title_fa").notNull(),
    titleEn: text("title_en").notNull(),
    descriptionFa: text("description_fa").notNull(),
    descriptionEn: text("description_en").notNull(),
    previewImageUrl: text("preview_image_url").notNull(),
    liveMenuUrl: text("live_menu_url").notNull(),
    status: text("status").notNull().default("draft"), // draft | published | archived
    sort: integer("sort").notNull().default(100),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("managed_demo_slug_uq").on(t.slug), index("managed_demo_status_idx").on(t.status, t.sort)],
);

/* ---------------------- Public portfolio ------------------------ */

export const portfolioProjects = pgTable(
  "portfolio_projects",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    titleFa: text("title_fa").notNull(),
    titleEn: text("title_en").notNull(),
    summaryFa: text("summary_fa").notNull(),
    summaryEn: text("summary_en").notNull(),
    clientName: text("client_name"),
    serviceFa: text("service_fa"),
    serviceEn: text("service_en"),
    liveUrl: text("live_url").notNull(),
    coverImageUrl: text("cover_image_url"),
    menuId: text("menu_id"),
    status: text("status").notNull().default("draft"), // draft | published | archived
    featured: boolean("featured").notNull().default(false),
    sort: integer("sort").notNull().default(100),
    launchedAt: timestamp("launched_at", { withTimezone: true }),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("portfolio_project_slug_uq").on(t.slug), index("portfolio_project_status_idx").on(t.status, t.sort)],
);

export const serviceQuotes = pgTable("service_quotes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  requestId: text("request_id")
    .notNull()
    .references(() => serviceRequests.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("IRT"),
  scope: text("scope").notNull(),
  attachments: jsonb("attachments"), // optional visual references included with quote
  // pending | approved | rejected | charged | waived
  status: text("status").notNull().default("pending"),
  quoteId: text("quote_id"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* --------------------- Message templates ------------------------- */

export const messageTemplates = pgTable(
  "message_templates",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    key: text("key").notNull(), // e.g. quote_sent
    scenario: text("scenario").notNull(),
    locale: text("locale").notNull(), // fa | en
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    variables: jsonb("variables"), // documentation of available vars
    isActive: boolean("is_active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("tpl_key_locale_uq").on(t.key, t.locale)],
);

/* ------------------------- Notifications ------------------------- */

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // project | payment | request | system | security
    titleFa: text("title_fa").notNull(),
    titleEn: text("title_en").notNull(),
    bodyFa: text("body_fa"),
    bodyEn: text("body_en"),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("notif_user_idx").on(t.userId, t.readAt)],
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    inApp: boolean("in_app").notNull().default(true),
    email: boolean("email").notNull().default(true),
    sms: boolean("sms").notNull().default(false),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
  },
);

/* ----------------------------- Media ----------------------------- */

export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id"),
    uploadedBy: text("uploaded_by"),
    kind: text("kind").notNull(), // image | document | spreadsheet | video | archive
    filename: text("filename").notNull(), // sanitized
    /** Customer-facing name (for food photos this is the dish/product name). */
    label: text("label"),
    /** Instructions supplied by the customer for this individual asset. */
    customerNotes: text("customer_notes"),
    /** received | editing | ready | placed | needs_info */
    workflowStatus: text("workflow_status").notNull().default("received"),
    /** Private production notes visible to creator/admin staff. */
    creatorNotes: text("creator_notes"),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    hash: text("hash").notNull(), // for duplicate detection
    storageKey: text("storage_key").notNull(),
    variants: jsonb("variants"), // generated thumb/webp/avif variants
    scanStatus: text("scan_status").notNull().default("pending"), // pending | clean | flagged
    status: text("status").notNull().default("active"), // active | archived | deleted
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("media_biz_idx").on(t.businessId),
    index("media_hash_idx").on(t.hash),
    index("media_workflow_idx").on(t.kind, t.workflowStatus),
  ],
);

/* ------------------------- Blog / content ------------------------ */

export const blogCategories = pgTable("blog_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  nameFa: text("name_fa").notNull(),
  nameEn: text("name_en").notNull(),
});

export const blogTags = pgTable("blog_tags", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  nameFa: text("name_fa").notNull(),
  nameEn: text("name_en").notNull(),
});

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    locale: text("locale").notNull(), // fa | en
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(), // markdown
    author: text("author").notNull(),
    reviewedBy: text("reviewed_by"),
    // draft | review | published | archived
    status: text("status").notNull().default("draft"),
    category: text("category"),
    tags: jsonb("tags"),
    heroMediaId: text("hero_media_id"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    canonicalUrl: text("canonical_url"),
    sources: jsonb("sources"), // citation metadata, no hallucinated stats
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("blog_locale_slug_uq").on(t.locale, t.slug),
    index("blog_status_idx").on(t.status),
    index("blog_published_idx").on(t.publishedAt),
  ],
);

/* --------------------------- Audit log --------------------------- */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    actorUserId: text("actor_user_id"),
    actorRole: text("actor_role"),
    action: text("action").notNull(), // menu.publish | refund.approve | ...
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    businessId: text("business_id"),
    previous: jsonb("previous"), // safe snapshot before
    next: jsonb("next"), // safe snapshot after
    correlationId: text("correlation_id"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_actor_idx").on(t.actorUserId),
    index("audit_target_idx").on(t.targetType, t.targetId),
    index("audit_created_idx").on(t.createdAt),
    index("audit_business_idx").on(t.businessId),
  ],
);

/* ------------------------ System events -------------------------- */

export const systemEvents = pgTable(
  "system_events",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    kind: text("kind").notNull(), // job_failure | payment_anomaly | queue_lag | backup ...
    severity: text("severity").notNull().default("info"), // info | warn | error
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sys_event_kind_idx").on(t.kind), index("sys_event_created_idx").on(t.createdAt)],
);

export const jobFailures = pgTable(
  "job_failures",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    queue: text("queue").notNull(),
    jobId: text("job_id"),
    payload: jsonb("payload"),
    error: text("error"),
    attempts: integer("attempts").notNull().default(1),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("job_fail_queue_idx").on(t.queue), index("job_fail_created_idx").on(t.createdAt)],
);

/** Privacy-conscious first-party analytics events (spec §43). */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    menuId: text("menu_id"),
    businessId: text("business_id"),
    type: text("type").notNull(), // menu_view | category_open | product_view | add_to_cart | order_placed | search | demo_view | ...
    locale: text("locale"),
    device: text("device"), // mobile | tablet | desktop (coarse)
    sourceId: text("source_id"), // opaque QR source
    value: text("value"), // search term, product slug, etc — sanitized
    sessionHash: text("session_hash"), // rotating daily salted hash, no raw IDs
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("analytics_menu_type_idx").on(t.menuId, t.type),
    index("analytics_biz_created_idx").on(t.businessId, t.createdAt),
  ],
);

/** Builder progress persistence (spec §24) — anonymous or attached. */
export const builderDrafts = pgTable(
  "builder_drafts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    anonId: text("anon_id"),
    userId: text("user_id"),
    step: integer("step").notNull().default(1),
    config: jsonb("config").notNull(),
    estimate: integer("estimate"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("builder_anon_idx").on(t.anonId), index("builder_user_idx").on(t.userId)],
);
