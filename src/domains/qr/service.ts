import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import { branches, menus, qrCodes, tables } from "@/domains/db/schema/index";
import { randomId } from "@/lib/utils";

export interface MenuQrRecord {
  id: string;
  sourceId: string;
  tableLabel: string | null;
  branchId: string | null;
  branchName: string | null;
  targetUrl: string;
  scanCount: number;
}

function targetPath(slug: string, tableToken: string | null, branchSlug?: string | null) {
  const base = `/menus/${slug}/menu`;
  const params = new URLSearchParams();
  if (branchSlug) params.set("branch", branchSlug);
  if (tableToken) params.set("table", tableToken);
  return params.size ? `${base}?${params.toString()}` : base;
}

async function createQr(menuId: string, tableId: string | null, targetUrl: string) {
  const db = getDb();
  for (let attempt = 0; attempt < 3; attempt++) {
    const [created] = await db.insert(qrCodes).values({
      id: crypto.randomUUID(),
      menuId,
      tableId,
      targetUrl,
      sourceId: randomId(18),
      design: { foreground: "#0e1117", background: "#ffffff", errorCorrection: "H" },
    }).onConflictDoNothing().returning();
    if (created) return created;
    const [existing] = await db.select().from(qrCodes).where(and(
      eq(qrCodes.menuId, menuId),
      tableId ? eq(qrCodes.tableId, tableId) : isNull(qrCodes.tableId),
    )).limit(1);
    if (existing) return existing;
  }
  throw new Error("Could not allocate a unique QR source id");
}

/** Create the permanent general-menu QR plus any missing table QR codes. Never replaces existing codes. */
export async function ensureMenuQrCodes(menuId: string, tableCount: number, requestedBranchId?: string | null): Promise<MenuQrRecord[]> {
  const db = getDb();
  const [menu] = await db.select().from(menus).where(eq(menus.id, menuId)).limit(1);
  if (!menu) throw new Error("menu_not_found");

  const [general] = await db
    .select()
    .from(qrCodes)
    .where(and(eq(qrCodes.menuId, menu.id), isNull(qrCodes.tableId)))
    .limit(1);
  const generalTarget = targetPath(menu.slug, null);
  if (!general) await createQr(menu.id, null, generalTarget);
  else if (general.targetUrl !== generalTarget) {
    await db.update(qrCodes).set({ targetUrl: generalTarget }).where(eq(qrCodes.id, general.id));
  }

  const safeCount = Math.max(0, Math.min(500, Math.floor(tableCount)));
  if (safeCount > 0) {
    let branch = menu.branchId
      ? (await db.select().from(branches).where(eq(branches.id, menu.branchId)).limit(1))[0]
      : undefined;
    if (!branch && requestedBranchId) {
      branch = (await db.select().from(branches).where(and(eq(branches.id, requestedBranchId), eq(branches.businessId, menu.businessId), eq(branches.isActive, true))).limit(1))[0];
      if (!branch) throw new Error("branch_not_found");
    }
    if (!branch) {
      branch = (await db.select().from(branches).where(and(eq(branches.businessId, menu.businessId), eq(branches.isActive, true))).orderBy(desc(branches.isPrimary), asc(branches.createdAt)).limit(1))[0];
    }
    if (!branch) {
      [branch] = await db.insert(branches).values({
        id: crypto.randomUUID(),
        businessId: menu.businessId,
        name: "Main branch",
        slug: "main",
        isPrimary: true,
      }).returning();
    }
    for (let index = 1; index <= safeCount; index++) {
      const label = String(index);
      let table = (await db.select().from(tables).where(and(eq(tables.branchId, branch.id), eq(tables.label, label))).limit(1))[0];
      if (!table) {
        [table] = await db.insert(tables).values({
          id: crypto.randomUUID(),
          branchId: branch.id,
          label,
          publicToken: randomId(18),
        }).returning();
      }
      const [existing] = await db.select().from(qrCodes).where(and(eq(qrCodes.menuId, menu.id), eq(qrCodes.tableId, table.id))).limit(1);
      const nextTarget = targetPath(menu.slug, table.publicToken, menu.branchId ? null : branch.slug);
      if (!existing) await createQr(menu.id, table.id, nextTarget);
      else if (existing.targetUrl !== nextTarget) {
        await db.update(qrCodes).set({ targetUrl: nextTarget }).where(eq(qrCodes.id, existing.id));
      }
    }
  }

  return listMenuQrCodes(menu.id);
}

export async function listMenuQrCodes(menuId: string): Promise<MenuQrRecord[]> {
  const db = getDb();
  const rows = await db
    .select({ qr: qrCodes, table: tables, branch: branches })
    .from(qrCodes)
    .leftJoin(tables, eq(qrCodes.tableId, tables.id))
    .leftJoin(branches, eq(tables.branchId, branches.id))
    .where(eq(qrCodes.menuId, menuId));
  return rows
    .map(({ qr, table, branch }) => ({ id: qr.id, sourceId: qr.sourceId, tableLabel: table?.label ?? null, branchId: branch?.id ?? null, branchName: branch?.name ?? null, targetUrl: qr.targetUrl, scanCount: qr.scanCount }))
    .sort((a, b) => a.tableLabel === null ? -1 : b.tableLabel === null ? 1 : Number(a.tableLabel) - Number(b.tableLabel));
}

/** Resolve a permanent QR source and record one privacy-safe aggregate scan. */
export async function resolveMenuQr(sourceId: string) {
  const db = getDb();
  const [row] = await db
    .select({ qr: qrCodes, menu: menus, table: tables, branch: branches })
    .from(qrCodes)
    .innerJoin(menus, eq(qrCodes.menuId, menus.id))
    .leftJoin(tables, eq(qrCodes.tableId, tables.id))
    .leftJoin(branches, eq(tables.branchId, branches.id))
    .where(eq(qrCodes.sourceId, sourceId))
    .limit(1);
  if (!row || row.menu.status !== "published") return null;
  await db.update(qrCodes).set({ scanCount: sql`${qrCodes.scanCount} + 1` }).where(eq(qrCodes.id, row.qr.id));
  return { targetUrl: targetPath(row.menu.slug, row.table?.publicToken ?? null, row.menu.branchId ? null : row.branch?.slug) };
}

export async function findMenuQr(sourceId: string) {
  const db = getDb();
  return (await db.select({ qr: qrCodes }).from(qrCodes).where(eq(qrCodes.sourceId, sourceId)).limit(1))[0]?.qr ?? null;
}
