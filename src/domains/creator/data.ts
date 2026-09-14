import { count, desc, eq, inArray, sum } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import { businesses, projects, projectFiles, serviceRequests, serviceRequestMessages, serviceQuotes, invoices, payments, user, menus, portfolioProjects, blogPosts, managedDemos, qrCodes, media, orders, orderItems, branches } from "@/domains/db/schema/index";

export async function getCreatorOverview() {
  const db = getDb();
  const [clients, activeProjects, openRequests, unpaidInvoices, publishedMenus, publishedWork, publishedPosts, managedDemoCount, revenue, qrScans] = await Promise.all([
    db.select({ c: count() }).from(businesses),
    db.select({ c: count() }).from(projects).where(inArray(projects.status, ["submitted", "quoted", "approved", "in_build", "review", "revision"])),
    db.select({ c: count() }).from(serviceRequests).where(inArray(serviceRequests.status, ["open", "quoted", "quote_approved", "in_progress"])),
    db.select({ c: count() }).from(invoices).where(inArray(invoices.status, ["draft", "sent", "partially_paid"])),
    db.select({ c: count() }).from(menus).where(eq(menus.status, "published")),
    db.select({ c: count() }).from(portfolioProjects).where(eq(portfolioProjects.status, "published")),
    db.select({ c: count() }).from(blogPosts).where(eq(blogPosts.status, "published")),
    db.select({ c: count() }).from(managedDemos).where(eq(managedDemos.status, "published")),
    db.select({ total: sum(payments.amount) }).from(payments).where(eq(payments.status, "paid")),
    db.select({ total: sum(qrCodes.scanCount) }).from(qrCodes),
  ]);
  const recentRequests = await db.select({ request: serviceRequests, business: businesses }).from(serviceRequests).innerJoin(businesses, eq(serviceRequests.businessId, businesses.id)).orderBy(desc(serviceRequests.updatedAt)).limit(8);
  return { kpis: { clients: clients[0]?.c ?? 0, activeProjects: activeProjects[0]?.c ?? 0, openRequests: openRequests[0]?.c ?? 0, unpaidInvoices: unpaidInvoices[0]?.c ?? 0, publishedMenus: publishedMenus[0]?.c ?? 0, publishedWork: publishedWork[0]?.c ?? 0, publishedPosts: publishedPosts[0]?.c ?? 0, managedDemos: managedDemoCount[0]?.c ?? 0, revenue: Number(revenue[0]?.total ?? 0), qrScans: Number(qrScans[0]?.total ?? 0) }, recentRequests };
}

export async function getCreatorQrMenus() {
  const db = getDb();
  return db.select({ menu: menus, business: businesses }).from(menus).innerJoin(businesses, eq(menus.businessId, businesses.id)).orderBy(desc(menus.updatedAt)).limit(200);
}

export async function getCreatorQrBranches() {
  const db = getDb();
  return db.select().from(branches).orderBy(desc(branches.isPrimary), branches.createdAt);
}

export async function getCreatorClients() {
  const db = getDb();
  return db.select({ business: businesses, owner: user }).from(businesses).leftJoin(user, eq(businesses.ownerUserId, user.id)).orderBy(desc(businesses.updatedAt)).limit(200);
}

/** Complete, immutable customer build orders with every attached production asset. */
export async function getCreatorProjects() {
  const db = getDb();
  const rows = await db
    .select({ project: projects, business: businesses, owner: user })
    .from(projects)
    .innerJoin(businesses, eq(projects.businessId, businesses.id))
    .leftJoin(user, eq(businesses.ownerUserId, user.id))
    .orderBy(desc(projects.createdAt))
    .limit(200);

  const projectIds = rows.map(({ project }) => project.id);
  const files = projectIds.length
    ? await db
        .select({ link: projectFiles, asset: media })
        .from(projectFiles)
        .innerJoin(media, eq(projectFiles.mediaId, media.id))
        .where(inArray(projectFiles.projectId, projectIds))
        .orderBy(desc(projectFiles.createdAt))
    : [];

  return { rows, files };
}

export async function getCreatorFoodAssets() {
  const db = getDb();
  return db
    .select({ asset: media, business: businesses, uploader: user })
    .from(media)
    .innerJoin(businesses, eq(media.businessId, businesses.id))
    .leftJoin(user, eq(media.uploadedBy, user.id))
    .where(eq(media.kind, "food_photo"))
    .orderBy(desc(media.updatedAt))
    .limit(500);
}

export async function getCreatorOrders() {
  const db = getDb();
  const selectRows = () => db.select({ order: orders, branch: branches, business: businesses }).from(orders).leftJoin(branches, eq(orders.branchId, branches.id)).innerJoin(businesses, eq(orders.businessId, businesses.id));
  const [active, recentClosed] = await Promise.all([
    selectRows().where(inArray(orders.status, ["placed", "awaiting_confirmation", "accepted", "preparing", "ready"])).orderBy(desc(orders.createdAt)).limit(500),
    selectRows().where(inArray(orders.status, ["completed", "rejected", "cancelled", "refunded"])).orderBy(desc(orders.createdAt)).limit(200),
  ]);
  const rows = [...active, ...recentClosed].sort((a, b) => b.order.createdAt.getTime() - a.order.createdAt.getTime());
  const ids = rows.map((row) => row.order.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  return { rows, items };
}

export async function getCreatorInbox() {
  const db = getDb();
  const requests = await db.select({ request: serviceRequests, business: businesses }).from(serviceRequests).innerJoin(businesses, eq(serviceRequests.businessId, businesses.id)).orderBy(desc(serviceRequests.updatedAt)).limit(100);
  const ids = requests.map((row) => row.request.id);
  const messages = ids.length
    ? await db
        .select({ message: serviceRequestMessages, author: user })
        .from(serviceRequestMessages)
        .leftJoin(user, eq(serviceRequestMessages.authorUserId, user.id))
        .where(inArray(serviceRequestMessages.requestId, ids))
        .orderBy(serviceRequestMessages.createdAt)
    : [];
  return { requests, messages };
}

export async function getCreatorQuotes() {
  const db = getDb();
  const requests = await db.select({ request: serviceRequests, business: businesses, project: projects }).from(serviceRequests).innerJoin(businesses, eq(serviceRequests.businessId, businesses.id)).leftJoin(projects, eq(serviceRequests.projectId, projects.id)).orderBy(desc(serviceRequests.updatedAt)).limit(100);
  const ids = requests.map((row) => row.request.id);
  const quotes = ids.length ? await db.select().from(serviceQuotes).where(inArray(serviceQuotes.requestId, ids)).orderBy(desc(serviceQuotes.createdAt)) : [];
  return { requests, quotes };
}
