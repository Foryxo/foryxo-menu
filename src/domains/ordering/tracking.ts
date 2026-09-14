import { eq } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import { branches, orderItems, orders } from "@/domains/db/schema/index";

export async function getPublicOrderTracking(token: string) {
  const db = getDb();
  const [row] = await db.select({ order: orders, branch: branches }).from(orders).leftJoin(branches, eq(orders.branchId, branches.id)).where(eq(orders.publicToken, token)).limit(1);
  if (!row) return null;
  const items = await db.select({ id: orderItems.id, name: orderItems.nameSnapshot, quantity: orderItems.quantity, lineTotal: orderItems.lineTotal }).from(orderItems).where(eq(orderItems.orderId, row.order.id));
  return {
    number: row.order.number,
    status: row.order.status,
    orderType: row.order.orderType,
    total: row.order.total,
    currency: row.order.currency,
    tableLabel: row.order.tableToken,
    branchName: row.branch?.name ?? null,
    branchPhone: row.branch?.phone ?? row.branch?.orderContactPhone ?? null,
    createdAt: row.order.createdAt.toISOString(),
    updatedAt: row.order.updatedAt.toISOString(),
    items,
  };
}

export type PublicOrderTracking = NonNullable<Awaited<ReturnType<typeof getPublicOrderTracking>>>;
