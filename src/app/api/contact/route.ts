/**
 * Public contact endpoint → creates a service request from a prospect.
 * Rate limited per IP; input sanitized; no enumeration.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/domains/db/client";
import { serviceRequests, businesses, businessMembers, user } from "@/domains/db/schema/index";
import { eq } from "drizzle-orm";
import { ipRateLimit } from "@/domains/auth/security";
import { sanitizeNote, randomId } from "@/lib/utils";

const bodySchema = z.object({
  locale: z.enum(["fa", "en"]).default("fa"),
  name: z.string().min(2).max(80),
  business: z.string().min(2).max(120),
  contact: z.string().min(5).max(120),
  message: z.string().min(5).max(2000),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "contact", 5, 3600);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const data = parsed.data;

  const db = getDb();
  const number = `SR-LEAD-${randomId(4).toUpperCase()}`;

  // A lead request is stored without a business account; attached later on signup.
  await db.insert(serviceRequests).values({
    id: crypto.randomUUID(),
    businessId: await getOrCreatePlaceholderBusinessId(data.business),
    number,
    category: "other",
    title: `Contact: ${sanitizeNote(data.business, 60)}`,
    body: sanitizeNote(
      `[${data.locale}] ${data.name} (${data.contact}): ${data.message}`,
      2000,
    ),
    urgency: "normal",
    status: "open",
    createdBy: "prospect",
  });

  return NextResponse.json({ ok: true, number });
}

/** Leads get a placeholder business row so the request has a valid FK. */
async function getOrCreatePlaceholderBusinessId(name: string): Promise<string> {
  const db = getDb();
  const slug = `lead-${randomId(6)}`;
  // Find a system user to own placeholder businesses.
  let owner = (await db.select().from(user).where(eq(user.role, "superadmin")).limit(1))[0];
  if (!owner) {
    // Fall back: create minimal owner row (dev seed normally provides admin).
    const [created] = await db
      .insert(user)
      .values({ id: crypto.randomUUID(), name: "System", email: `system-${randomId(4)}@foryxo.local` })
      .returning();
    owner = created;
  }
  const [biz] = await db
    .insert(businesses)
    .values({
      id: crypto.randomUUID(),
      ownerUserId: owner.id,
      name: sanitizeNote(name, 80),
      slug,
      businessType: "other",
      status: "prospect",
    })
    .returning();
  await db.insert(businessMembers).values({
    id: crypto.randomUUID(),
    businessId: biz.id,
    userId: owner.id,
    role: "owner",
  });
  return biz.id;
}
