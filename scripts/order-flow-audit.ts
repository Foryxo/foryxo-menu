import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { POST as placeOrder } from "../src/app/api/orders/route";
import { closeDb, getDb } from "../src/domains/db/client";
import { auditLogs, branches, menuVersions, menus, notifications, orders } from "../src/domains/db/schema/index";
import type { MenuReadModel } from "../src/domains/menu-engine/read-model";
import { getPublicOrderTracking } from "../src/domains/ordering/tracking";
import { ensureMenuQrCodes } from "../src/domains/qr/service";

async function main() {
const db = getDb();
const [menu] = await db.select().from(menus).where(and(eq(menus.status, "published"), isNull(menus.branchId))).limit(1);
assert(menu?.publishedVersionId, "A published shared menu is required for the integration audit");
const [version] = await db.select().from(menuVersions).where(eq(menuVersions.id, menu.publishedVersionId)).limit(1);
const originalModel = version.readModel as MenuReadModel;
const product = originalModel.categories.flatMap((category) => category.products).find((item) => item.available && item.price > 0);
assert(product, "The audit menu needs one available product");

const branchId = crypto.randomUUID();
const branchSlug = `audit-${Date.now()}`;
let orderId: string | null = null;
let orderNumber: string | null = null;
try {
  await db.insert(branches).values({ id: branchId, businessId: menu.businessId, name: "Order flow audit", slug: branchSlug, isPrimary: false, isActive: true, acceptsOrders: true, fulfillmentTypes: ["takeaway"], minimumOrder: 0 });
  await db.update(menus).set({ orderingEnabled: true }).where(eq(menus.id, menu.id));
  await db.update(menuVersions).set({ readModel: { ...originalModel, capabilities: { ...originalModel.capabilities, ordering: true } } }).where(eq(menuVersions.id, version.id));

  const idempotencyKey = crypto.randomUUID();
  const payload = { menuId: menu.id, idempotencyKey, branchId, orderType: "takeaway", customerName: "Audit customer", customerPhone: "+989120000000", items: [{ productId: product.id, quantity: 1, selections: {} }] };
  const first = await placeOrder(new NextRequest("http://localhost/api/orders", { method: "POST", headers: { "content-type": "application/json", "x-real-ip": "127.0.0.42" }, body: JSON.stringify(payload) }));
  assert.equal(first.status, 201);
  const created = await first.json();
  orderId = created.orderId;
  orderNumber = created.number;
  assert.match(created.trackingUrl, /^\/orders\/[a-f0-9]{36}$/);

  const duplicate = await placeOrder(new NextRequest("http://localhost/api/orders", { method: "POST", headers: { "content-type": "application/json", "x-real-ip": "127.0.0.42" }, body: JSON.stringify(payload) }));
  assert.equal(duplicate.status, 200);
  assert.equal((await duplicate.json()).orderId, orderId);
  const tracking = await getPublicOrderTracking(created.trackingUrl.split("/").pop());
  assert.equal(tracking?.number, created.number);
  assert.equal(tracking?.items.length, 1);

  const codes = await ensureMenuQrCodes(menu.id, 1, branchId);
  const tableCode = codes.find((code) => code.branchId === branchId && code.tableLabel === "1");
  assert(tableCode);
  assert(tableCode.targetUrl.includes(`branch=${branchSlug}`));
  assert.match(tableCode.targetUrl, /table=[a-f0-9]{36}/);
  const [menuAfterQr] = await db.select().from(menus).where(eq(menus.id, menu.id)).limit(1);
  assert.equal(menuAfterQr.branchId, null, "Table QR generation must preserve shared-menu mode");
  console.log("✓ Order flow audit passed: branch checkout, idempotency, tracking, and secure table QR");
} finally {
  if (orderId) await db.delete(orders).where(eq(orders.id, orderId));
  if (orderNumber) await db.delete(notifications).where(eq(notifications.titleEn, `New order ${orderNumber}`));
  await db.delete(auditLogs).where(and(eq(auditLogs.targetType, "order"), orderId ? eq(auditLogs.targetId, orderId) : undefined));
  await db.delete(branches).where(eq(branches.id, branchId));
  await db.update(menus).set({ orderingEnabled: menu.orderingEnabled }).where(eq(menus.id, menu.id));
  await db.update(menuVersions).set({ readModel: originalModel }).where(eq(menuVersions.id, version.id));
  await closeDb();
}
}

void main().catch(async (error) => {
  console.error(error);
  await closeDb().catch(() => undefined);
  process.exitCode = 1;
});
