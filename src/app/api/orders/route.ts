import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { audit } from "@/domains/audit/log";
import { ipRateLimit } from "@/domains/auth/security";
import { getDb } from "@/domains/db/client";
import { branches, businessMembers, menuVersions, menus, notifications, orderItems, orders, tables } from "@/domains/db/schema/index";
import type { MenuReadModel } from "@/domains/menu-engine/read-model";
import { calculateCart } from "@/domains/pricing/engine";
import { randomId, sanitizeNote } from "@/lib/utils";

const orderSchema = z.object({
  menuId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  branchId: z.string().uuid().nullable().optional(),
  tableToken: z.string().max(80).optional().default(""),
  orderType: z.enum(["dine_in", "takeaway", "delivery"]),
  customerName: z.string().min(2).max(80),
  customerPhone: z.string().regex(/^[+\d][\d\s()-]{6,29}$/),
  customerAddress: z.string().max(500).optional().default(""),
  note: z.string().max(500).optional().default(""),
  items: z.array(z.object({
    productId: z.string().min(1).max(120),
    quantity: z.number().int().min(1).max(99),
    selections: z.record(z.string(), z.array(z.string().max(120)).max(20)).default({}),
    note: z.string().max(200).optional().default(""),
  })).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "public-order", 12, 900);
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = orderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_order" }, { status: 400 });
  const input = parsed.data;
  if (input.orderType === "delivery" && !input.customerAddress.trim()) return NextResponse.json({ error: "delivery_address_required" }, { status: 422 });

  const db = getDb();
  const [existingOrder] = await db.select().from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existingOrder) return NextResponse.json({ ok: true, orderId: existingOrder.id, number: existingOrder.number, total: existingOrder.total, trackingUrl: `/orders/${existingOrder.publicToken}` }, { status: 200 });
  const [menu] = await db.select().from(menus).where(and(eq(menus.id, input.menuId), eq(menus.status, "published"), eq(menus.orderingEnabled, true))).limit(1);
  if (!menu?.publishedVersionId) return NextResponse.json({ error: "ordering_unavailable" }, { status: 409 });
  const [version] = await db.select().from(menuVersions).where(eq(menuVersions.id, menu.publishedVersionId)).limit(1);
  const model = version?.readModel as MenuReadModel | null;
  if (!model) return NextResponse.json({ error: "menu_unavailable" }, { status: 409 });

  let branch: typeof branches.$inferSelect | undefined;
  if (input.branchId) branch = (await db.select().from(branches).where(and(eq(branches.id, input.branchId), eq(branches.businessId, menu.businessId), eq(branches.isActive, true))).limit(1))[0];
  const activeBranches = await db.select({ id: branches.id }).from(branches).where(and(eq(branches.businessId, menu.businessId), eq(branches.isActive, true)));
  if (activeBranches.length > 0 && !input.branchId) return NextResponse.json({ error: "branch_required" }, { status: 422 });
  if (menu.branchId && menu.branchId !== branch?.id) return NextResponse.json({ error: "wrong_branch" }, { status: 422 });
  if (input.branchId && (!branch || !branch.acceptsOrders)) return NextResponse.json({ error: "branch_not_accepting_orders" }, { status: 409 });
  if (branch) {
    const methods = Array.isArray(branch.fulfillmentTypes) ? branch.fulfillmentTypes as string[] : [];
    if (!methods.includes(input.orderType)) return NextResponse.json({ error: "fulfillment_unavailable" }, { status: 422 });
  }
  let tableLabel: string | null = null;
  if (input.tableToken) {
    const [table] = await db.select().from(tables).where(and(eq(tables.publicToken, input.tableToken), eq(tables.isActive, true))).limit(1);
    if (!table || !branch || table.branchId !== branch.id) return NextResponse.json({ error: "invalid_table" }, { status: 422 });
    tableLabel = table.label;
  }

  const products = model.categories.flatMap((category) => category.products);
  const cart = calculateCart(input.items.map((item) => ({ ...item, note: sanitizeNote(item.note, 200) })), (id) => products.find((product) => product.id === id));
  if (cart.lines.some((line) => line.errors.length) || cart.total <= 0) return NextResponse.json({ error: "cart_changed", lines: cart.lines.map((line) => ({ productId: line.productId, errors: line.errors })) }, { status: 409 });
  if (branch && cart.total < branch.minimumOrder) return NextResponse.json({ error: "minimum_order", minimum: branch.minimumOrder }, { status: 422 });

  const number = `FM-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${randomId(3).toUpperCase()}`;
  const orderId = crypto.randomUUID();
  const publicToken = randomId(18);
  const orderValues = {
    id: orderId, number, idempotencyKey: input.idempotencyKey, publicToken, businessId: menu.businessId, menuId: menu.id, branchId: branch?.id ?? menu.branchId ?? null,
    tableToken: tableLabel, status: "awaiting_confirmation", orderType: input.orderType,
    customerName: sanitizeNote(input.customerName, 80), customerPhone: sanitizeNote(input.customerPhone, 30),
    customerAddress: sanitizeNote(input.customerAddress, 500) || null, subtotal: cart.subtotal, discountTotal: cart.discountTotal,
    serviceFee: cart.serviceFee, taxTotal: cart.taxTotal, total: cart.total, currency: model.business.currency || "IRT",
    note: sanitizeNote(input.note, 500) || null, paymentMethod: "cash", paymentStatus: "unpaid",
  } as const;
  const members = await db.select({ userId: businessMembers.userId }).from(businessMembers).where(eq(businessMembers.businessId, menu.businessId));
  try {
    await db.transaction(async (tx) => {
      await tx.insert(orders).values(orderValues);
      await tx.insert(orderItems).values(cart.lines.map((line) => ({ id: crypto.randomUUID(), orderId, productId: line.productId, nameSnapshot: line.nameSnapshot, unitPriceSnapshot: line.unitPrice, modifiersSnapshot: line.modifiersSnapshot, quantity: line.quantity, lineTotal: line.lineTotal, note: line.note })));
      if (members.length) await tx.insert(notifications).values(members.map(({ userId }) => ({ id: crypto.randomUUID(), userId, kind: "order", titleFa: `سفارش جدید ${number}`, titleEn: `New order ${number}`, bodyFa: `${branch?.name ?? model.title} · ${cart.total.toLocaleString("fa-IR")} تومان`, bodyEn: `${branch?.name ?? model.title} · ${cart.total.toLocaleString("en-US")} Toman`, link: "/dashboard/orders" })));
    });
  } catch (error) {
    const [duplicate] = await db.select().from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey)).limit(1);
    if (duplicate) return NextResponse.json({ ok: true, orderId: duplicate.id, number: duplicate.number, total: duplicate.total, trackingUrl: `/orders/${duplicate.publicToken}` }, { status: 200 });
    throw error;
  }
  await audit.log({ action: "order.place", targetType: "order", targetId: orderId, businessId: menu.businessId, ip, next: { number, branchId: orderValues.branchId, total: orderValues.total } });
  return NextResponse.json({ ok: true, orderId, number, total: orderValues.total, trackingUrl: `/orders/${publicToken}` }, { status: 201 });
}
