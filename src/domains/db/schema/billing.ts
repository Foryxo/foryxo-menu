/**
 * Billing schema — price catalog, quotes, invoices, payments, refunds,
 * and the immutable service-credit ledger (spec §31, §51).
 *
 * MONEY RULES:
 * - All amounts are integers in IRT (Toman). Never floating point.
 * - Ledger entries are immutable; balances are derived from ledger.
 * - Every ledger write carries idempotencyKey to prevent double-credit.
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

/* -------------------------- Price catalog -------------------------- */

export const priceCatalog = pgTable(
  "price_catalog",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    key: text("key").notNull(), // stable machine key e.g. "package.plus"
    category: text("category").notNull(), // package | addon | content | design | language | ordering | domain | hosting | support | urgent | custom
    internalLabel: text("internal_label").notNull(),
    customerLabelFa: text("customer_label_fa").notNull(),
    customerLabelEn: text("customer_label_en").notNull(),
    unit: text("unit").notNull().default("fixed"), // fixed | per_item | per_hour
    minPrice: integer("min_price"),
    defaultPrice: integer("default_price").notNull(), // Toman
    maxPrice: integer("max_price"),
    isRecurring: boolean("is_recurring").notNull().default(false),
    recurringPeriod: text("recurring_period"), // annual | monthly
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    effectiveFrom: timestamp("effective_from", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("price_key_uq").on(t.key), index("price_cat_idx").on(t.category)],
);

/* ----------------------------- Quotes ------------------------------ */

export const quotes = pgTable(
  "quotes",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    number: text("number").notNull(), // Q-1405-0001
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id),
    projectId: text("project_id"),
    serviceRequestId: text("service_request_id"),
    // draft | sent | approved | rejected | expired | converted
    status: text("status").notNull().default("draft"),
    currency: text("currency").notNull().default("IRT"),
    subtotal: integer("subtotal").notNull().default(0),
    discountTotal: integer("discount_total").notNull().default(0),
    total: integer("total").notNull().default(0),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    notes: text("notes"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("quote_number_uq").on(t.number),
    index("quote_biz_idx").on(t.businessId),
    index("quote_status_idx").on(t.status),
  ],
);

export const quoteItems = pgTable(
  "quote_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    catalogKey: text("catalog_key"), // links to price_catalog
    labelFa: text("label_fa").notNull(),
    labelEn: text("label_en").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: integer("unit_price").notNull(), // Toman
    discount: integer("discount").notNull().default(0),
    lineTotal: integer("line_total").notNull(),
    isRecurring: boolean("is_recurring").notNull().default(false),
    taxable: boolean("taxable").notNull().default(false),
    isComplimentary: boolean("is_complimentary").notNull().default(false),
    notes: text("notes"),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("quote_item_quote_idx").on(t.quoteId)],
);

/* ----------------------------- Invoices ---------------------------- */

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    number: text("number").notNull(), // INV-1405-0001
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id),
    quoteId: text("quote_id"),
    // draft | sent | partially_paid | paid | void
    status: text("status").notNull().default("draft"),
    currency: text("currency").notNull().default("IRT"),
    subtotal: integer("subtotal").notNull(),
    discountTotal: integer("discount_total").notNull().default(0),
    total: integer("total").notNull(),
    paidTotal: integer("paid_total").notNull().default(0),
    dueDate: timestamp("due_date", { withTimezone: true }),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("invoice_number_uq").on(t.number),
    index("invoice_biz_idx").on(t.businessId),
    index("invoice_status_idx").on(t.status),
  ],
);

/* ----------------------------- Payments ---------------------------- */

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id),
    invoiceId: text("invoice_id"),
    provider: text("provider").notNull(), // zarinpal | yekpay | mock | wallet
    providerRef: text("provider_ref"), // authority (ZarinPal) / gateway ref
    amount: integer("amount").notNull(), // Toman
    currency: text("currency").notNull().default("IRT"),
    // initiated | redirect_pending | verifying | paid | failed | cancelled | refunded
    status: text("status").notNull().default("initiated"),
    purpose: text("purpose").notNull(), // invoice | wallet_topup
    idempotencyKey: text("idempotency_key").notNull(),
    callbackUrl: text("callback_url"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("payment_idem_uq").on(t.idempotencyKey),
    index("payment_biz_idx").on(t.businessId),
    index("payment_status_idx").on(t.status),
    index("payment_provider_ref_idx").on(t.providerRef),
  ],
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // created | redirected | verify_ok | verify_failed | duplicate_callback | refunded ...
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("pay_event_payment_idx").on(t.paymentId)],
);

export const refunds = pgTable(
  "refunds",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id),
    paymentId: text("payment_id"),
    ledgerEntryId: text("ledger_entry_id"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("IRT"),
    reason: text("reason").notNull(),
    // requested | reviewing | approved | rejected | processing
    // | provider_submitted | completed | failed
    status: text("status").notNull().default("requested"),
    rejectionReason: text("rejection_reason"),
    requestedBy: text("requested_by"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("refund_biz_idx").on(t.businessId),
    index("refund_status_idx").on(t.status),
  ],
);

/* ------------------- Service credit / wallet ledger ------------------ */

export const creditAccounts = pgTable(
  "credit_accounts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id),
    currency: text("currency").notNull().default("IRT"),
    /** Denormalized mirror for fast reads ONLY. Ledger is source of truth. */
    balanceCached: integer("balance_cached").notNull().default(0),
    holdsCached: integer("holds_cached").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("credit_account_biz_uq").on(t.businessId)],
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id")
      .notNull()
      .references(() => creditAccounts.id),
    amount: integer("amount").notNull(), // signed: + credit, - debit (Toman)
    currency: text("currency").notNull().default("IRT"),
    direction: text("direction").notNull(), // credit | debit
    // topup | refund | adjustment | hold | capture | release
    // | service_charge | withdrawal | bonus
    category: text("category").notNull(),
    referenceType: text("reference_type"), // payment | quote | service_request | withdrawal | manual
    referenceId: text("reference_id"),
    description: text("description"),
    createdBy: text("created_by"), // user or "system"
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("ledger_idem_uq").on(t.idempotencyKey),
    index("ledger_account_created_idx").on(t.accountId, t.createdAt),
    index("ledger_reference_idx").on(t.referenceType, t.referenceId),
  ],
);

export const withdrawalRequests = pgTable(
  "withdrawal_requests",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("IRT"),
    destination: text("destination").notNull(), // masked bank/payment destination
    reason: text("reason"),
    // requested | reviewing | approved | rejected | processing
    // | provider_submitted | completed | failed
    status: text("status").notNull().default("requested"),
    rejectionReason: text("rejection_reason"),
    requestedBy: text("requested_by"),
    reviewedBy: text("reviewed_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("withdrawal_biz_idx").on(t.businessId), index("withdrawal_status_idx").on(t.status)],
);

export const promoCodes = pgTable(
  "promo_codes",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull(),
    kind: text("kind").notNull(), // percent | fixed
    value: integer("value").notNull(),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [uniqueIndex("promo_code_uq").on(t.code)],
);
