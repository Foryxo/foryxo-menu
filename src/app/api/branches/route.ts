import { NextResponse, type NextRequest } from "next/server";
import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { audit } from "@/domains/audit/log";
import { auth } from "@/domains/auth/server";
import { ipRateLimit } from "@/domains/auth/security";
import { getDb } from "@/domains/db/client";
import { branches, businessMembers } from "@/domains/db/schema/index";
import { randomId, sanitizeNote, slugify } from "@/lib/utils";

const branchInput = z.object({
  businessId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  address: z.string().max(500).optional().default(""),
  city: z.string().max(80).optional().default(""),
  province: z.string().max(80).optional().default(""),
  phone: z.string().max(30).optional().default(""),
  mapUrl: z.string().url().max(500).or(z.literal("")).optional().default(""),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
  acceptsOrders: z.boolean().default(false),
  fulfillmentTypes: z.array(z.enum(["dine_in", "takeaway", "delivery"])).max(3).default([]),
  minimumOrder: z.number().int().min(0).max(2_000_000_000).default(0),
  orderContactPhone: z.string().max(30).optional().default(""),
  notificationEmail: z.string().email().max(160).or(z.literal("")).optional().default(""),
});

async function authorized(req: NextRequest, businessId: string) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role ?? "business";
  if (["superadmin", "creator", "admin", "editor"].includes(role)) return session;
  const db = getDb();
  const [membership] = await db.select().from(businessMembers).where(and(eq(businessMembers.businessId, businessId), eq(businessMembers.userId, session.user.id))).limit(1);
  return membership && ["owner", "manager"].includes(membership.role) ? session : null;
}

async function save(req: NextRequest, editing: boolean) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "branch-write", 40, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = branchInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success || (editing && !parsed.data?.branchId)) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const input = parsed.data;
  const session = await authorized(req, input.businessId);
  if (!session?.user) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (input.acceptsOrders && input.fulfillmentTypes.length === 0) return NextResponse.json({ error: "fulfillment_required" }, { status: 422 });

  const db = getDb();
  const [existing] = editing
    ? await db.select().from(branches).where(and(eq(branches.id, input.branchId!), eq(branches.businessId, input.businessId))).limit(1)
    : [];
  if (editing && !existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [total] = await db.select({ value: count() }).from(branches).where(eq(branches.businessId, input.businessId));
  if (!editing && Number(total?.value ?? 0) >= 50) return NextResponse.json({ error: "branch_limit" }, { status: 422 });

  if (input.isPrimary) await db.update(branches).set({ isPrimary: false, updatedAt: new Date() }).where(and(eq(branches.businessId, input.businessId), input.branchId ? ne(branches.id, input.branchId) : undefined));

  const values = {
    name: sanitizeNote(input.name, 100),
    address: sanitizeNote(input.address, 500) || null,
    city: sanitizeNote(input.city, 80) || null,
    province: sanitizeNote(input.province, 80) || null,
    phone: sanitizeNote(input.phone, 30) || null,
    mapUrl: input.mapUrl || null,
    isPrimary: input.isPrimary || (!editing && Number(total?.value ?? 0) === 0),
    isActive: input.isActive,
    acceptsOrders: input.acceptsOrders,
    fulfillmentTypes: input.fulfillmentTypes,
    minimumOrder: input.minimumOrder,
    orderContactPhone: sanitizeNote(input.orderContactPhone, 30) || null,
    notificationEmail: input.notificationEmail || null,
    updatedAt: new Date(),
  };

  const [row] = editing
    ? await db.update(branches).set(values).where(eq(branches.id, input.branchId!)).returning()
    : await db.insert(branches).values({ id: crypto.randomUUID(), businessId: input.businessId, slug: `${slugify(input.name) || "branch"}-${randomId(3)}`, ...values }).returning();

  await audit.log({ actorUserId: session.user.id, action: editing ? "branch.update" : "branch.create", targetType: "branch", targetId: row.id, businessId: input.businessId, next: { acceptsOrders: row.acceptsOrders, fulfillmentTypes: row.fulfillmentTypes } });
  return NextResponse.json({ ok: true, branch: row });
}

export async function POST(req: NextRequest) { return save(req, false); }
export async function PATCH(req: NextRequest) { return save(req, true); }
