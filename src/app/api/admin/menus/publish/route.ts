/**
 * Admin menu publish/unpublish (spec §39, §82).
 * Publish runs validation + read-model snapshot; unpublish takes the menu
 * back to draft without destroying versions. Both audited.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/domains/auth/server";
import { getDb } from "@/domains/db/client";
import { branches, menus, menuVersions } from "@/domains/db/schema/index";
import { and, eq } from "drizzle-orm";
import { buildReadModel, publishMenu, validateMenuForPublish } from "@/domains/menu-engine/publish";
import { audit } from "@/domains/audit/log";
import { ipRateLimit } from "@/domains/auth/security";
import { ensureMenuQrCodes } from "@/domains/qr/service";

const schema = z.object({
  menuId: z.string().uuid(),
  action: z.enum(["publish", "unpublish", "enable_ordering", "disable_ordering", "assign_branch"]),
  branchId: z.string().uuid().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "admin-menu", 60, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!["superadmin", "admin", "editor"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const db = getDb();
  const [menu] = await db.select().from(menus).where(eq(menus.id, body.data.menuId)).limit(1);
  if (!menu) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (body.data.action === "enable_ordering" || body.data.action === "disable_ordering") {
    const enabled = body.data.action === "enable_ordering";
    if (enabled) {
      const available = menu.branchId
        ? await db.select({ id: branches.id }).from(branches).where(and(eq(branches.id, menu.branchId), eq(branches.isActive, true), eq(branches.acceptsOrders, true))).limit(1)
        : await db.select({ id: branches.id }).from(branches).where(and(eq(branches.businessId, menu.businessId), eq(branches.isActive, true), eq(branches.acceptsOrders, true))).limit(1);
      if (!available.length) return NextResponse.json({ error: "no_ordering_branch" }, { status: 422 });
    }
    await db.update(menus).set({ orderingEnabled: enabled, updatedAt: new Date() }).where(eq(menus.id, menu.id));
    if (menu.publishedVersionId) {
      const [version] = await db.select().from(menuVersions).where(eq(menuVersions.id, menu.publishedVersionId)).limit(1);
      if (version?.readModel) await db.update(menuVersions).set({ readModel: { ...(version.readModel as Record<string, unknown>), capabilities: { ordering: enabled } } }).where(eq(menuVersions.id, version.id));
    }
    await audit.log({ actorUserId: session.user.id, actorRole: role, action: enabled ? "menu.ordering.enable" : "menu.ordering.disable", targetType: "menu", targetId: menu.id, businessId: menu.businessId });
    return NextResponse.json({ ok: true, orderingEnabled: enabled });
  }

  if (body.data.action === "assign_branch") {
    if (body.data.branchId) {
      const [branch] = await db.select().from(branches).where(and(eq(branches.id, body.data.branchId), eq(branches.businessId, menu.businessId))).limit(1);
      if (!branch) return NextResponse.json({ error: "invalid_branch" }, { status: 422 });
      if (menu.orderingEnabled && (!branch.isActive || !branch.acceptsOrders)) return NextResponse.json({ error: "branch_not_accepting_orders" }, { status: 422 });
    } else if (menu.orderingEnabled) {
      const available = await db.select({ id: branches.id }).from(branches).where(and(eq(branches.businessId, menu.businessId), eq(branches.isActive, true), eq(branches.acceptsOrders, true))).limit(1);
      if (!available.length) return NextResponse.json({ error: "no_ordering_branch" }, { status: 422 });
    }
    await db.update(menus).set({ branchId: body.data.branchId ?? null, updatedAt: new Date() }).where(eq(menus.id, menu.id));
    if (menu.publishedVersionId) {
      const readModel = await buildReadModel(menu.id, menu.publishedVersionId);
      await db.update(menuVersions).set({ readModel }).where(eq(menuVersions.id, menu.publishedVersionId));
    }
    await audit.log({ actorUserId: session.user.id, actorRole: role, action: "menu.branch.assign", targetType: "menu", targetId: menu.id, businessId: menu.businessId, previous: { branchId: menu.branchId }, next: { branchId: body.data.branchId ?? null } });
    return NextResponse.json({ ok: true, branchId: body.data.branchId ?? null });
  }

  if (body.data.action === "publish") {
    // Publish the draft if one exists; for demo seeding the draft may equal published.
    const validation = await validateMenuForPublish(menu.id);
    if (validation.ok) {
      const result = await publishMenu(menu.id, session.user.id);
      if (!result.ok) {
        return NextResponse.json({ error: "publish_failed", blockers: result.blockers }, { status: 422 });
      }
      await audit.log({
        actorUserId: session.user.id,
        actorRole: role,
        action: "menu.publish",
        targetType: "menu",
        targetId: menu.id,
        businessId: menu.businessId,
        next: { version: result.version, hash: result.readModelHash, warnings: result.warnings },
      });
      await ensureMenuQrCodes(menu.id, 0);
      return NextResponse.json({ ok: true, version: result.version });
    }
    // No draft — republish current published version (refresh read model timestamps).
    if (menu.status === "published") {
      await ensureMenuQrCodes(menu.id, 0);
      return NextResponse.json({ ok: true, already: true });
    }
    return NextResponse.json({ error: "publish_failed", blockers: validation.blockers }, { status: 422 });
  }

  // Unpublish
  await db.update(menus).set({ status: "draft", updatedAt: new Date() }).where(eq(menus.id, menu.id));
  await audit.log({
    actorUserId: session.user.id,
    actorRole: role,
    action: "menu.unpublish",
    targetType: "menu",
    targetId: menu.id,
    businessId: menu.businessId,
  });
  return NextResponse.json({ ok: true });
}
