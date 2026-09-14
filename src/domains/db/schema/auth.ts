/**
 * Identity & auth schema (Better Auth compatible + Foryxo extensions).
 */
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    phone: text("phone"), // normalized E.164, e.g. +989121234567
    phoneVerified: boolean("phone_verified").notNull().default(false),
    locale: text("locale").notNull().default("fa"),
    role: text("role").notNull().default("business"), // superadmin | creator | admin | finance | support | editor | business | consumer
    totpSecret: text("totp_secret"),
    isSuspended: boolean("is_suspended").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("user_email_uq").on(t.email),
    index("user_phone_idx").on(t.phone),
    index("user_role_idx").on(t.role),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    // "business" | "consumer" | "admin" — Better Auth impersonation + our guards
    activeContext: text("active_context").notNull().default("business"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("session_token_uq").on(t.token),
    index("session_user_idx").on(t.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(), // google | credential | email-otp | phone-otp
    accountId: text("account_id").notNull(),
    accessToken: text("access_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshToken: text("refresh_token"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    idToken: text("id_token"),
    scope: text("scope"),
    password: text("password"), // rarely used; OTP-first design
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("account_provider_uq").on(t.providerId, t.accountId),
    index("account_user_idx").on(t.userId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(), // email or phone
    value: text("value").notNull(), // hashed OTP or token
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    purpose: text("purpose").notNull().default("otp"), // otp | email_change | phone_change | domain_verify
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("verification_identifier_idx").on(t.identifier),
    index("verification_expires_idx").on(t.expiresAt),
  ],
);

export const securityEvents = pgTable(
  "security_events",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id"),
    type: text("type").notNull(), // login_success | login_failed | otp_sent | otp_failed | suspicious | password_change ...
    ip: text("ip"),
    userAgent: text("user_agent"),
    metadata: text("metadata"), // JSON string, never contains OTPs/secrets
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sec_events_user_idx").on(t.userId),
    index("sec_events_created_idx").on(t.createdAt),
    index("sec_events_type_idx").on(t.type),
  ],
);
