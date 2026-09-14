import type { Config } from "drizzle-kit";

/**
 * drizzle-kit is used for `generate`/`studio` against the canonical schema.
 * Migrations run via scripts/db-migrate.ts, which supports both PGLite (dev)
 * and Postgres (production) through the unified db client.
 */
export default {
  dialect: "postgresql",
  schema: "./src/domains/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    // Placeholder for drizzle-kit introspection tooling; actual runtime uses src/domains/db/client.ts
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/foryxo_menu",
  },
  strict: true,
  verbose: true,
} satisfies Config;
