import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { builderConfigSchema } from "@/domains/builder/config";
import { getDb } from "@/domains/db/client";
import { invoices, ledgerEntries, menus, projects, serviceQuotes, serviceRequests } from "@/domains/db/schema/index";

/** Count only already-issued numbered tables in the requested branch/range. */
export function additionalTableQrCodes(
  existing: { branchId: string | null; tableLabel: string | null }[],
  branchId: string,
  requestedCount: number,
): number {
  const covered = new Set(existing
    .filter((code) => code.branchId === branchId && code.tableLabel !== null)
    .map((code) => Number(code.tableLabel))
    .filter((number) => Number.isInteger(number) && number >= 1 && number <= requestedCount));
  return Math.max(0, requestedCount - covered.size);
}

/** Paid table-QR allowance from the immutable builder order, never a UI count. */
export async function getTableQrAllowance(menuId: string): Promise<number> {
  const db = getDb();
  const [menu] = await db.select({ businessId: menus.businessId }).from(menus).where(eq(menus.id, menuId)).limit(1);
  if (!menu) return 0;

  const [project] = await db.select().from(projects).where(and(
    eq(projects.businessId, menu.businessId),
    ne(projects.status, "cancelled"),
  )).orderBy(desc(projects.createdAt)).limit(1);
  if (!project || (project.menuId && project.menuId !== menuId)) return 0;
  const parsed = builderConfigSchema.safeParse(project.configuration);
  if (!parsed.success || !parsed.data.features.includes("table_qr")) return 0;
  const ordered = parsed.data.qrTableCount;
  if (ordered < 1) return 0;

  const [approved] = await db.select({ quote: serviceQuotes }).from(serviceQuotes)
    .innerJoin(serviceRequests, eq(serviceQuotes.requestId, serviceRequests.id))
    .where(and(
      eq(serviceRequests.projectId, project.id),
      inArray(serviceQuotes.status, ["approved", "waived"]),
    ))
    .orderBy(desc(serviceQuotes.createdAt))
    .limit(1);
  if (!approved) return 0;
  if (approved.quote.status === "waived" || approved.quote.amount === 0) return ordered;

  const [paidInvoice] = await db.select({ id: invoices.id }).from(invoices).where(and(
    eq(invoices.quoteId, approved.quote.id),
    eq(invoices.status, "paid"),
  )).limit(1);
  if (paidInvoice) return ordered;

  const [fundedHold] = await db.select({ id: ledgerEntries.id }).from(ledgerEntries).where(and(
    eq(ledgerEntries.referenceType, "service_quote"),
    eq(ledgerEntries.referenceId, approved.quote.id),
    eq(ledgerEntries.category, "hold"),
  )).limit(1);
  return fundedHold ? ordered : 0;
}
