/** One-time owner provisioning. Password is read from the environment, hashed, and never logged. */
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { env, isProd } from "../src/config/env";

async function main() {
  if (!env.OWNER_BOOTSTRAP_PASSWORD || env.OWNER_BOOTSTRAP_PASSWORD.length < 14) throw new Error("OWNER_BOOTSTRAP_PASSWORD must be at least 14 characters.");
  const { getDb } = await import("../src/domains/db/client");
  const { user, account } = await import("../src/domains/db/schema/index");
  const db = getDb();
  let owner = (await db.select().from(user).where(eq(user.email, env.OWNER_EMAIL.toLowerCase())).limit(1))[0];
  if (!owner) [owner] = await db.insert(user).values({ id: randomUUID(), name: "Foryxo Owner", email: env.OWNER_EMAIL.toLowerCase(), emailVerified: true, role: "superadmin" }).returning();
  else [owner] = await db.update(user).set({ role: "superadmin", emailVerified: true, isSuspended: false, updatedAt: new Date() }).where(eq(user.id, owner.id)).returning();
  const hashed = await hashPassword(env.OWNER_BOOTSTRAP_PASSWORD);
  const existing = (await db.select().from(account).where(and(eq(account.providerId, "credential"), eq(account.accountId, owner.id))).limit(1))[0];
  if (existing) await db.update(account).set({ password: hashed, updatedAt: new Date() }).where(eq(account.id, existing.id));
  else await db.insert(account).values({ id: randomUUID(), userId: owner.id, providerId: "credential", accountId: owner.id, password: hashed });
  console.log(`✓ Owner access provisioned for ${env.OWNER_EMAIL}. Password was not printed.`);
  if (isProd) console.log("Remove OWNER_BOOTSTRAP_PASSWORD from the runtime environment after provisioning.");
}
main().then(async()=>{const{closeDb}=await import("../src/domains/db/client");await closeDb();}).catch(async(error)=>{console.error(error instanceof Error?error.message:"Owner provisioning failed");try{const{closeDb}=await import("../src/domains/db/client");await closeDb();}catch{}process.exitCode=1;});
