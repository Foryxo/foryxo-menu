/**
 * Migration runner.
 * - PGLite (dev): push schema directly (dev convenience, logged clearly).
 * - Postgres (prod): apply generated SQL migrations from /drizzle in order,
 *   tracked in __foryxo_migrations.
 *
 * Never runs destructive operations automatically.
 */
import { resolve } from "node:path";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { env } from "../src/config/env";

async function main() {
  if (env.DB_DRIVER === "pglite") {
    mkdirSync(resolve(process.cwd(), env.DATA_DIR, "pglite"), { recursive: true });
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const pg = new PGlite(`${env.DATA_DIR}/pglite`);
    const db = drizzle(pg);
    const folder = resolve(process.cwd(), "drizzle");
    try {
      if (!existsSync(folder)) {
        throw new Error("No /drizzle folder. Run `npm run db:generate` first.");
      }
      await migrate(db, { migrationsFolder: folder });
      console.log("✓ PGLite migrations applied from /drizzle");
    } finally {
      await pg.close();
    }
    return;
  }

  // Postgres path
  const { PGlite: _unused } = await import("@electric-sql/pglite");
  void _unused;
  const postgres = (await import("postgres")).default;
  const client = postgres(env.DATABASE_URL!, { max: 1 });
  const folder = resolve(process.cwd(), "drizzle");
  if (!existsSync(folder)) {
    console.error("✗ No /drizzle migrations folder. Run `npm run db:generate` first.");
    process.exit(1);
  }
  const files = readdirSync(folder)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  await client`CREATE TABLE IF NOT EXISTS __foryxo_migrations (
    id serial PRIMARY KEY,
    name text NOT NULL UNIQUE,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`;
  for (const f of files) {
    const applied = await client`SELECT 1 FROM __foryxo_migrations WHERE name = ${f}`;
    if (applied.length > 0) continue;
    const sql = readFileSync(resolve(folder, f), "utf8");
    try {
      await client.begin(async (tx) => {
        await tx.unsafe(sql);
        await tx`INSERT INTO __foryxo_migrations (name) VALUES (${f})`;
      });
      console.log("✓ applied", f);
    } catch (err) {
      console.error("✗ failed", f, err);
      process.exit(1);
    }
  }
  await client.end();
  console.log("✓ Postgres migrations up to date");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
