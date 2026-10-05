/**
 * Admin data loaders (server-only). Role enforcement happens in layout.
 */
import { and, count, desc, eq, gte, inArray, isNull, sum } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import { getAdminOverviewAccess } from "@/domains/admin/policies";
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

export async function getAdminOverview(role: string) {
  const db = getDb();
  const access = getAdminOverviewAccess(role);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const zeroCount = () => Promise.resolve([{ c: 0 }]);

  const [
    totalUsers,
    newSignups,
    activeClients,
    publishedMenus,
    pendingBuilds,
    openRequests,
    failedPayments,
  ] = await Promise.all([
    access.users ? db.select({ c: count() }).from(user) : zeroCount(),
    access.users ? db.select({ c: count() }).from(user).where(gte(user.createdAt, thirtyDaysAgo)) : zeroCount(),
    access.clients ? db.select({ c: count() }).from(businesses).where(eq(businesses.status, "active")) : zeroCount(),
    access.menus ? db.select({ c: count() }).from(menus).where(eq(menus.status, "published")) : zeroCount(),
    access.projects ? db.select({ c: count() }).from(projects).where(inArray(projects.status, ["submitted", "quoted", "approved", "in_build", "review", "revision"])) : zeroCount(),
    access.requests ? db.select({ c: count() }).from(serviceRequests).where(inArray(serviceRequests.status, ["open", "quoted", "quote_approved", "in_progress"])) : zeroCount(),
    access.payments ? db.select({ c: count() }).from(payments).where(eq(payments.status, "failed")) : zeroCount(),
  ]);

  const [revenueRows, refundRows, liabilityRows] = await Promise.all([
    access.payments
      ? db.select({ total: sum(payments.amount) }).from(payments).where(eq(payments.status, "paid"))
      : Promise.resolve([{ total: 0 }]),
    access.payments
      ? db.select({ total: sum(refunds.amount) }).from(refunds).where(inArray(refunds.status, ["approved", "processing", "provider_submitted", "completed"]))
      : Promise.resolve([{ total: 0 }]),
    access.payments
      ? db.select({ total: sum(creditAccounts.balanceCached) }).from(creditAccounts)
      : Promise.resolve([{ total: 0 }]),
  ]);
  const [revenueRow] = revenueRows;
  const [refundRow] = refundRows;
  const [liabilityRow] = liabilityRows;

  const recentProjects = access.projects
    ? await db
        .select({ project: projects, business: businesses })
        .from(projects)
        .innerJoin(businesses, eq(projects.businessId, businesses.id))
        .orderBy(desc(projects.createdAt))
        .limit(8)
    : [];

  const recentPayments = access.payments
    ? await db
        .select({ payment: payments, business: businesses })
        .from(payments)
        .innerJoin(businesses, eq(payments.businessId, businesses.id))
        .orderBy(desc(payments.createdAt))
        .limit(8)
    : [];

  return {
    access,
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
