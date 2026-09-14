import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { env } from "../src/config/env";
import { getDb } from "../src/domains/db/client";
import { user } from "../src/domains/db/schema/auth";

async function upsertStaff(email: string, name: string, role: "superadmin" | "creator") {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const [existing] = await db.select().from(user).where(eq(user.email, normalized)).limit(1);
  if (existing) {
    await db.update(user).set({ role, isSuspended: false, emailVerified: true, updatedAt: new Date() }).where(eq(user.id, existing.id));
    return;
  }
  await db.insert(user).values({ id: randomUUID(), name, email: normalized, emailVerified: true, role, isSuspended: false });
}

async function main() {
  if (env.ADMIN_EMAIL.toLowerCase() === env.CREATOR_EMAIL.toLowerCase()) {
    throw new Error("ADMIN_EMAIL and CREATOR_EMAIL must be different accounts.");
  }
  await upsertStaff(env.ADMIN_EMAIL, "Foryxo Admin", "superadmin");
  await upsertStaff(env.CREATOR_EMAIL, "Foryxo Creator", "creator");
  console.log("Staff email roles are ready. No passwords were created or printed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Staff bootstrap failed");
  process.exitCode = 1;
});
