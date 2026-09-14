/**
 * Dashboard data loaders — all tenant-scoped by the authenticated user's
 * businesses. Server-only.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import {
  businesses,
  businessMembers,
  projects,
  projectStatusHistory,
  creditAccounts,
  ledgerEntries,
  serviceRequests,
  invoices,
  menus,
  notifications,
  payments,
  media,
  branches,
  orders,
  orderItems,
} from "@/domains/db/schema/index";

export async function getMyBusinesses(userId: string) {
  const db = getDb();
  const rows = await db
    .select({ business: businesses, role: businessMembers.role })
    .from(businessMembers)
    .innerJoin(businesses, eq(businessMembers.businessId, businesses.id))
    .where(eq(businessMembers.userId, userId));
  return rows;
}

export async function requireMyBusiness(userId: string, businessId?: string) {
  const rows = await getMyBusinesses(userId);
  const found = businessId ? rows.find((r) => r.business.id === businessId) : rows[0];
  return found ?? null;
}

export async function getDashboardOverview(userId: string) {
  const db = getDb();
  const memberships = await getMyBusinesses(userId);
  if (memberships.length === 0) return null;
  const business = memberships[0].business;
  const businessIds = memberships.map((m) => m.business.id);

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.businessId, business.id)))
    .orderBy(desc(projects.createdAt))
    .limit(1);

  const history = project
    ? await db
        .select()
        .from(projectStatusHistory)
        .where(eq(projectStatusHistory.projectId, project.id))
        .orderBy(projectStatusHistory.createdAt)
    : [];

  const [account] = await db
    .select()
    .from(creditAccounts)
    .where(eq(creditAccounts.businessId, business.id))
    .limit(1);

  const ledger = account
    ? await db
        .select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.accountId, account.id))
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(10)
    : [];

  const requests = await db
    .select()
    .from(serviceRequests)
    .where(and(inArray(serviceRequests.businessId, businessIds)))
    .orderBy(desc(serviceRequests.createdAt))
    .limit(10);

  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.businessId, business.id)))
    .orderBy(desc(invoices.createdAt))
    .limit(10);

  const unpaid = invoiceRows.find((i) => i.status === "sent" || i.status === "partially_paid");

  const menu = (
    await db.select().from(menus).where(eq(menus.businessId, business.id)).limit(1)
  )[0];

  const notifs = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(8);

  const myPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.businessId, business.id))
    .orderBy(desc(payments.createdAt))
    .limit(10);

  const files = await db
    .select()
    .from(media)
    .where(eq(media.businessId, business.id))
    .orderBy(desc(media.createdAt))
    .limit(20);

  return {
    business,
    role: memberships[0].role,
    project,
    history,
    account,
    ledger,
    requests,
    invoices: invoiceRows,
    unpaid,
    menu,
    notifications: notifs,
    payments: myPayments,
    files,
  };
}

export type DashboardData = NonNullable<Awaited<ReturnType<typeof getDashboardOverview>>>;

export async function getDashboardBranches(userId: string) {
  const db = getDb();
  const memberships = await getMyBusinesses(userId);
  const allowed = memberships.filter((entry) => ["owner", "manager"].includes(entry.role));
  if (!allowed.length) return null;
  const business = allowed[0].business;
  const rows = await db.select().from(branches).where(eq(branches.businessId, business.id)).orderBy(desc(branches.isPrimary), branches.createdAt);
  return { business, branches: rows };
}

export async function getDashboardOrders(userId: string) {
  const db = getDb();
  const memberships = await getMyBusinesses(userId);
  const allowed = memberships.filter((entry) => ["owner", "manager", "order_manager"].includes(entry.role));
  if (!allowed.length) return null;
  const businessIds = allowed.map((entry) => entry.business.id);
  const selectRows = () => db.select({ order: orders, branch: branches, business: businesses }).from(orders).leftJoin(branches, eq(orders.branchId, branches.id)).innerJoin(businesses, eq(orders.businessId, businesses.id));
  const [active, recentClosed] = await Promise.all([
    selectRows().where(and(inArray(orders.businessId, businessIds), inArray(orders.status, ["placed", "awaiting_confirmation", "accepted", "preparing", "ready"]))).orderBy(desc(orders.createdAt)).limit(500),
    selectRows().where(and(inArray(orders.businessId, businessIds), inArray(orders.status, ["completed", "rejected", "cancelled", "refunded"]))).orderBy(desc(orders.createdAt)).limit(200),
  ]);
  const rows = [...active, ...recentClosed].sort((a, b) => b.order.createdAt.getTime() - a.order.createdAt.getTime());
  const ids = rows.map((row) => row.order.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  return { businesses: allowed.map((entry) => entry.business), orders: rows, items };
}
