import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { audit } from "@/domains/audit/log";
import { auth } from "@/domains/auth/server";
import { getDb } from "@/domains/db/client";
import { businessMembers, orderStatusHistory, orders } from "@/domains/db/schema/index";
import { sanitizeNote } from "@/lib/utils";

const schema = z.object({ status: z.enum(["accepted", "preparing", "ready", "completed", "rejected"]), note: z.string().max(300).optional().default("") });
const transitions: Record<string, string[]> = { awaiting_confirmation: ["accepted", "rejected"], accepted: ["preparing", "rejected"], preparing: ["ready"], ready: ["completed"] };

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { id } = await ctx.params;
  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const role = (session.user as { role?: string }).role ?? "business";
  const [membership] = await db.select().from(businessMembers).where(and(eq(businessMembers.businessId, order.businessId), eq(businessMembers.userId, session.user.id))).limit(1);
  const hasGlobalAccess = ["superadmin", "creator", "admin"].includes(role);
  if (!hasGlobalAccess && !membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!hasGlobalAccess && membership && !["owner", "manager", "order_manager"].includes(membership.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(transitions[order.status] ?? []).includes(body.data.status)) return NextResponse.json({ error: "invalid_transition" }, { status: 409 });
  if (body.data.status === "rejected" && !body.data.note.trim()) return NextResponse.json({ error: "rejection_reason_required" }, { status: 422 });
  const note = sanitizeNote(body.data.note, 300) || null;
  const updated = await db.transaction(async (tx) => {
    const [next] = await tx.update(orders).set({ status: body.data.status, updatedAt: new Date() }).where(and(eq(orders.id, id), eq(orders.status, order.status))).returning();
    if (!next) return null;
    await tx.insert(orderStatusHistory).values({ id: crypto.randomUUID(), orderId: id, fromStatus: order.status, toStatus: body.data.status, actorUserId: session.user.id, note });
    return next;
  });
  if (!updated) return NextResponse.json({ error: "order_changed", message: "Refresh the order and try again." }, { status: 409 });
  await audit.log({ actorUserId: session.user.id, actorRole: role, action: "order.status.update", targetType: "order", targetId: id, businessId: order.businessId, previous: { status: order.status }, next: { status: updated.status, note } });
  return NextResponse.json({ ok: true, order: updated });
}
