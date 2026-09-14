/**
 * Admin data loaders (server-only). Role enforcement happens in layout.
 */
import { and, count, desc, eq, gte, inArray, isNull, sum } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import {
  businesses,
  projects,
  serviceRequests,
  menus,
  payments,
  refunds,
  creditAccounts,
  user,
  builderDrafts,
  branches,
} from "@/domains/db/schema/index";

export async function getAdminOverview() {
  const db = getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [
    totalUsers,
    newSignups,
    activeClients,
    publishedMenus,
    pendingBuilds,
    openRequests,
    failedPayments,
  ] = await Promise.all([
    db.select({ c: count() }).from(user),
    db.select({ c: count() }).from(user).where(gte(user.createdAt, thirtyDaysAgo)),
    db.select({ c: count() }).from(businesses).where(eq(businesses.status, "active")),
    db.select({ c: count() }).from(menus).where(eq(menus.status, "published")),
    db.select({ c: count() }).from(projects).where(inArray(projects.status, ["submitted", "quoted", "approved", "in_build", "review", "revision"])),
    db.select({ c: count() }).from(serviceRequests).where(inArray(serviceRequests.status, ["open", "quoted", "quote_approved", "in_progress"])),
    db.select({ c: count() }).from(payments).where(eq(payments.status, "failed")),
  ]);

  const [revenueRow] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(eq(payments.status, "paid"));
  const [refundRow] = await db
    .select({ total: sum(refunds.amount) })
    .from(refunds)
    .where(inArray(refunds.status, ["approved", "processing", "provider_submitted", "completed"]));
  const [liabilityRow] = await db
    .select({ total: sum(creditAccounts.balanceCached) })
    .from(creditAccounts);

  const recentProjects = await db
    .select({ project: projects, business: businesses })
    .from(projects)
    .innerJoin(businesses, eq(projects.businessId, businesses.id))
    .orderBy(desc(projects.createdAt))
    .limit(8);

  const recentPayments = await db
    .select({ payment: payments, business: businesses })
    .from(payments)
    .innerJoin(businesses, eq(payments.businessId, businesses.id))
    .orderBy(desc(payments.createdAt))
    .limit(8);

  return {
    kpis: {
      totalUsers: totalUsers[0]?.c ?? 0,
      newSignups: newSignups[0]?.c ?? 0,
      activeClients: activeClients[0]?.c ?? 0,
      publishedMenus: publishedMenus[0]?.c ?? 0,
      pendingBuilds: pendingBuilds[0]?.c ?? 0,
      openRequests: openRequests[0]?.c ?? 0,
      failedPayments: failedPayments[0]?.c ?? 0,
      revenue: Number(revenueRow?.total ?? 0),
      refunds: Number(refundRow?.total ?? 0),
      walletLiability: Number(liabilityRow?.total ?? 0),
    },
    recentProjects,
    recentPayments,
  };
}

/** Leads: builder drafts that never became projects. */
export async function getLeads() {
  const db = getDb();
  const rows = await db
    .select({ draft: builderDrafts, user })
    .from(builderDrafts)
    .leftJoin(user, eq(builderDrafts.userId, user.id))
    .where(and(isNull(builderDrafts.userId)))
    .orderBy(desc(builderDrafts.updatedAt))
    .limit(50);
  const attached = await db
    .select({ draft: builderDrafts, user })
    .from(builderDrafts)
    .innerJoin(user, eq(builderDrafts.userId, user.id))
    .orderBy(desc(builderDrafts.updatedAt))
    .limit(50);
  return { anonymous: rows, attached };
}

export async function getAdminProjects() {
  const db = getDb();
  return db
    .select({ project: projects, business: businesses })
    .from(projects)
    .innerJoin(businesses, eq(projects.businessId, businesses.id))
    .orderBy(desc(projects.createdAt))
    .limit(100);
}

export async function getAdminRequests() {
  const db = getDb();
  return db
    .select({ request: serviceRequests, business: businesses, project: projects })
    .from(serviceRequests)
    .innerJoin(businesses, eq(serviceRequests.businessId, businesses.id))
    .leftJoin(projects, eq(serviceRequests.projectId, projects.id))
    .orderBy(desc(serviceRequests.createdAt))
    .limit(100);
}

export async function getAdminPayments() {
  const db = getDb();
  const rows = await db
    .select({ payment: payments, business: businesses })
    .from(payments)
    .innerJoin(businesses, eq(payments.businessId, businesses.id))
    .orderBy(desc(payments.createdAt))
    .limit(100);
  const refundRows = await db
    .select({ refund: refunds, business: businesses })
    .from(refunds)
    .innerJoin(businesses, eq(refunds.businessId, businesses.id))
    .orderBy(desc(refunds.createdAt))
    .limit(50);
  return { payments: rows, refunds: refundRows };
}

export async function getAdminMenus() {
  const db = getDb();
  return db
    .select({ menu: menus, business: businesses })
    .from(menus)
    .innerJoin(businesses, eq(menus.businessId, businesses.id))
    .orderBy(desc(menus.updatedAt))
    .limit(100);
}

export async function getAdminBranches() {
  const db = getDb();
  return db.select().from(branches).orderBy(desc(branches.isPrimary), branches.createdAt);
}

export async function getAdminBusinesses() {
  const db = getDb();
  return db.select().from(businesses).orderBy(businesses.name).limit(200);
}
