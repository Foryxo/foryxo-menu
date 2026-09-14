import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/domains/auth/server";
import { ipRateLimit } from "@/domains/auth/security";
import { ensureMenuQrCodes, listMenuQrCodes } from "@/domains/qr/service";
import { audit } from "@/domains/audit/log";
import { additionalTableQrCodes, getTableQrAllowance } from "@/domains/qr/allowance";
import { getDb } from "@/domains/db/client";
import { menus } from "@/domains/db/schema/index";
import { eq } from "drizzle-orm";

const inputSchema = z.object({ menuId: z.string().uuid(), branchId: z.string().uuid().nullable().optional(), tableCount: z.number().int().min(0).max(500), overrideReason: z.string().trim().min(15).max(300).optional() });

async function staff(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  return session?.user && ["superadmin", "creator", "admin", "editor"].includes(role) ? { session, role } : null;
}

export async function GET(req: NextRequest) {
  if (!(await staff(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const menuId = req.nextUrl.searchParams.get("menuId");
  if (!menuId || !z.string().uuid().safeParse(menuId).success) return NextResponse.json({ error: "invalid_menu" }, { status: 400 });
  return NextResponse.json({ ok: true, codes: await listMenuQrCodes(menuId), tableQrAllowance: await getTableQrAllowance(menuId) });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const limit = await ipRateLimit(ip, "creator-qr", 40, 3600);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const actor = await staff(req);
  if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = inputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input", fields: parsed.error.flatten() }, { status: 400 });
  try {
    const [menu] = await getDb().select({ branchId: menus.branchId }).from(menus).where(eq(menus.id, parsed.data.menuId)).limit(1);
    if (!menu) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (menu.branchId && parsed.data.branchId && menu.branchId !== parsed.data.branchId) {
      return NextResponse.json({ error: "invalid_branch" }, { status: 422 });
    }
    const effectiveBranchId = menu.branchId ?? parsed.data.branchId ?? null;
    if (parsed.data.tableCount > 0 && !effectiveBranchId) {
      return NextResponse.json({ error: "branch_required" }, { status: 422 });
    }
    const existing = await listMenuQrCodes(parsed.data.menuId);
    const allowance = await getTableQrAllowance(parsed.data.menuId);
    const override = actor.role === "superadmin" && Boolean(parsed.data.overrideReason);
    if (parsed.data.overrideReason && !override) return NextResponse.json({ error: "override_requires_superadmin" }, { status: 403 });
    const totalExisting = existing.filter((code) => code.tableLabel !== null).length;
    const additional = effectiveBranchId ? additionalTableQrCodes(existing, effectiveBranchId, parsed.data.tableCount) : 0;
    if (!override && totalExisting + additional > allowance) {
      return NextResponse.json({ error: "table_qr_quote_or_payment_required", tableQrAllowance: allowance, existingTableCodes: totalExisting }, { status: 422 });
    }
    const codes = await ensureMenuQrCodes(parsed.data.menuId, parsed.data.tableCount, effectiveBranchId);
    await audit.log({ actorUserId: actor.session.user.id, actorRole: actor.role, action: override ? "qr.ensure.override" : "qr.ensure", targetType: "menu", targetId: parsed.data.menuId, next: { tableCount: parsed.data.tableCount, branchId: parsed.data.branchId ?? null, allowance, overrideReason: override ? parsed.data.overrideReason : undefined } });
    return NextResponse.json({ ok: true, codes });
  } catch (error) {
    if (error instanceof Error && ["menu_not_found", "branch_not_found"].includes(error.message)) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: "qr_generation_failed" }, { status: 500 });
  }
}
