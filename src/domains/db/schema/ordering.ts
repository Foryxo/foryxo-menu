/**
 * Ordering schema — carts, orders, items, modifier snapshots, status history.
 * Order items store immutable snapshots (spec §27) — totals are never
 * recomputed from current menu prices.
 */
import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { businesses, branches } from "./business";
import { menus } from "./menu";
import { user } from "./auth";

export const carts = pgTable(
  "carts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    menuId: text("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    anonId: text("anon_id"), // cookie ref for guests
    userId: text("user_id").references(() => user.id),
    tableToken: text("table_token"),
    items: jsonb("items").notNull(), // [{productId, qty, modifierSelections[], note}]
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("cart_menu_idx").on(t.menuId), index("cart_anon_idx").on(t.anonId)],
);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    number: text("number").notNull(),
    idempotencyKey: text("idempotency_key"),
    publicToken: text("public_token").notNull(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    menuId: text("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    branchId: text("branch_id").references(() => branches.id),
    tableToken: text("table_token"),
    consumerUserId: text("consumer_user_id").references(() => user.id),
    // draft | placed | payment_pending | paid | awaiting_confirmation | accepted
    // | preparing | ready | completed | rejected | cancelled | refunded | partially_refunded
    status: text("status").notNull().default("draft"),
    orderType: text("order_type").notNull().default("dine_in"), // dine_in | table | takeaway | delivery
    customerName: text("customer_name"),
    customerPhone: text("customer_phone"),
    customerAddress: text("customer_address"),
    subtotal: integer("subtotal").notNull(), // integer Toman snapshot
    discountTotal: integer("discount_total").notNull().default(0),
    serviceFee: integer("service_fee").notNull().default(0),
    taxTotal: integer("tax_total").notNull().default(0),
    total: integer("total").notNull(),
    currency: text("currency").notNull().default("IRT"),
    note: text("note"),
    paymentMethod: text("payment_method"), // gateway | cash | external
    paymentStatus: text("payment_status"), // unpaid | paid | refunded | partially_refunded
    sourceId: text("source_id"), // opaque QR source
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("order_number_uq").on(t.number),
    uniqueIndex("order_idempotency_uq").on(t.idempotencyKey),
    uniqueIndex("order_public_token_uq").on(t.publicToken),
    index("order_biz_created_idx").on(t.businessId, t.createdAt),
    index("order_status_idx").on(t.status),
    index("order_menu_idx").on(t.menuId),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id"),
    nameSnapshot: text("name_snapshot").notNull(),
    unitPriceSnapshot: integer("unit_price_snapshot").notNull(),
    modifiersSnapshot: jsonb("modifiers_snapshot"), // [{name, priceDelta}]
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
    note: text("note"), // kitchen note — sanitized, length-limited
    customRequestNote: text("custom_request_note"),
  },
  (t) => [index("order_item_order_idx").on(t.orderId)],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    actorUserId: text("actor_user_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("order_hist_order_idx").on(t.orderId)],
);

/** Optional waiter-call events (spec §29) — rate limited at API layer. */
export const waiterCalls = pgTable(
  "waiter_calls",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    tableToken: text("table_token").notNull(),
    // call_waiter | request_bill | request_water | request_assistance
    requestType: text("request_type").notNull(),
    status: text("status").notNull().default("open"), // open | acknowledged | completed
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("waiter_biz_idx").on(t.businessId, t.status),
    index("waiter_table_idx").on(t.tableToken),
  ],
);

/** Consumer favorites & private notes (spec §42). */
export const favorites = pgTable(
  "favorites",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id"),
    menuId: text("menu_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("fav_user_idx").on(t.userId),
    index("fav_menu_idx").on(t.menuId),
  ],
);
