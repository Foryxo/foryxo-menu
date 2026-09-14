/**
 * Unified database client.
 * - Development / test: PGLite (embedded Postgres) — zero external services.
 * - Production: PostgreSQL via postgres.js driver.
 * Same Drizzle API for both.
 */
import { drizzle as drizzlePgLite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema/index";
import { env } from "@/config/env";

type Db = NodePgDatabase<typeof schema> | ReturnType<typeof drizzlePgLite>;

declare module "drizzle-orm" {
  // Marker interface required by Drizzle's typeful database augmentation.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TypefulPgDatabase {}
}

// Singleton across HMR / serverless invocations.
const globalForDb = globalThis as unknown as {
  foryxoDb?: Db;
  foryxoPglite?: PGlite;
  foryxoPgClient?: ReturnType<typeof postgres>;
};

export function getDb(): Db {
  if (globalForDb.foryxoDb) return globalForDb.foryxoDb;

  let db: Db;
  if (env.DB_DRIVER === "postgres") {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required when DB_DRIVER=postgres");
    }
    const client = postgres(env.DATABASE_URL, {
      max: env.DATABASE_POOL_MAX,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    globalForDb.foryxoPgClient = client;
    db = drizzlePg(client, { schema });
  } else {
    // Next's production build evaluates server modules in parallel workers.
    // They must not compete for the same on-disk PGlite lock while collecting routes.
    const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
    const pg = new PGlite(isProductionBuild ? undefined : env.DATA_DIR ? `${env.DATA_DIR}/pglite` : undefined);
    globalForDb.foryxoPglite = pg;
    db = drizzlePgLite(pg, { schema });
  }

  globalForDb.foryxoDb = db;
  return db;
}

/** Flush and close embedded/remote clients so development data is not left mid-write. */
export async function closeDb(): Promise<void> {
  if (globalForDb.foryxoPglite) {
    await globalForDb.foryxoPglite.close();
  }
  if (globalForDb.foryxoPgClient) {
    await globalForDb.foryxoPgClient.end();
  }
  delete globalForDb.foryxoDb;
  delete globalForDb.foryxoPglite;
  delete globalForDb.foryxoPgClient;
}

export type Database = Db;
export { schema };
