/**
 * Business, membership, branch and client-project schema.
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
import { user } from "./auth";

export const businesses = pgTable(
  "businesses",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id),
    name: text("name").notNull(), // canonical FA name
    nameEn: text("name_en"),
    slug: text("slug").notNull(), // reserved after project approval
    businessType: text("business_type").notNull(), // cafe | restaurant | cafe_restaurant | fastfood | iranian | bakery | brunch | healthy | foodhall | other
    status: text("status").notNull().default("prospect"), // prospect | active | paused | closed
    timezone: text("timezone").notNull().default("Asia/Tehran"),
    currency: text("currency").notNull().default("IRT"), // IRT = Toman (see docs: money)
    logoMediaId: text("logo_media_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("business_slug_uq").on(t.slug),
    index("business_owner_idx").on(t.ownerUserId),
    index("business_status_idx").on(t.status),
  ],
);

export const businessMembers = pgTable(
  "business_members",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // owner | manager | menu_editor | order_manager | analyst
    role: text("role").notNull().default("owner"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("biz_member_uq").on(t.businessId, t.userId),
    index("biz_member_user_idx").on(t.userId),
  ],
);

export const branches = pgTable(
  "branches",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    address: text("address"),
    city: text("city"),
    province: text("province"),
    country: text("country").default("IR"),
    phone: text("phone"),
    latitude: text("latitude"),
    longitude: text("longitude"),
    mapUrl: text("map_url"),
    timezone: text("timezone").notNull().default("Asia/Tehran"),
    openingHours: jsonb("opening_hours"), // [{ day:0-6, open:"07:00", close:"12:00" }]
    isPrimary: boolean("is_primary").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    acceptsOrders: boolean("accepts_orders").notNull().default(false),
    fulfillmentTypes: jsonb("fulfillment_types"), // ["dine_in","takeaway","delivery"]
    minimumOrder: integer("minimum_order").notNull().default(0),
    orderContactPhone: text("order_contact_phone"),
    notificationEmail: text("notification_email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("branch_biz_slug_uq").on(t.businessId, t.slug),
    index("branch_biz_idx").on(t.businessId),
  ],
);

export const businessSettings = pgTable("business_settings", {
  businessId: text("business_id")
    .primaryKey()
    .references(() => businesses.id, { onDelete: "cascade" }),
  locale: text("locale").notNull().default("fa"),
  social: jsonb("social"), // { instagram, telegram, whatsapp, website }
  reservationUrl: text("reservation_url"),
  description: text("description"),
  descriptionEn: text("description_en"),
  servesCuisine: text("serves_cuisine"),
  priceRange: text("price_range"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ---------------- Projects (client build lifecycle) ---------------- */

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    demoId: text("demo_id"), // chosen demo design
    configuration: jsonb("configuration").notNull(), // immutable builder snapshot
    // submitted | quoted | approved | in_build | review | revision | approved_final | published | cancelled
    status: text("status").notNull().default("submitted"),
    revisionRoundsIncluded: integer("revision_rounds_included")
      .notNull()
      .default(2),
    revisionRoundsUsed: integer("revision_rounds_used").notNull().default(0),
    menuId: text("menu_id"), // created on first version
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("project_biz_idx").on(t.businessId),
    index("project_status_idx").on(t.status),
  ],
);

export const projectStatusHistory = pgTable(
  "project_status_history",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    note: text("note"),
    actorUserId: text("actor_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("proj_hist_project_idx").on(t.projectId)],
);

export const projectFiles = pgTable(
  "project_files",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    mediaId: text("media_id").notNull(),
    kind: text("kind").notNull(), // logo | menu_doc | photos | spreadsheet | other
    uploadedBy: text("uploaded_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("proj_file_project_idx").on(t.projectId)],
);

export const projectComments = pgTable(
  "project_comments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").notNull(),
    body: text("body").notNull(),
    isInternal: boolean("is_internal").notNull().default(false), // admin-only notes never shown to client
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("proj_comment_project_idx").on(t.projectId)],
);

/* ---------------- Onboarding checklist ---------------- */

export const onboardingChecklist = pgTable(
  "onboarding_checklist",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    step: text("step").notNull(), // account_verified | business_info | demo_selected | ...
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("checklist_uq").on(t.businessId, t.step)],
);
