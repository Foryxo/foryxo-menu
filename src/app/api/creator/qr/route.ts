import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/domains/auth/server";
import { ipRateLimit } from "@/domains/auth/security";
import { ensureMenuQrCodes, listMenuQrCodes } from "@/domains/qr/service";
import { audit } from "@/domains/audit/log";

const inputSchema = z.object({ menuId: z.string().uuid(), branchId: z.string().uuid().nullable().optional(), tableCount: z.number().int().min(0).max(500) });

async function staff(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  return session?.user && ["superadmin", "creator", "admin", "editor"].includes(role) ? { session, role } : null;
}

export async function GET(req: NextRequest) {
  if (!(await staff(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const menuId = req.nextUrl.searchParams.get("menuId");
  if (!menuId || !z.string().uuid().safeParse(menuId).success) return NextResponse.json({ error: "invalid_menu" }, { status: 400 });
  return NextResponse.json({ ok: true, codes: await listMenuQrCodes(menuId) });
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
    const codes = await ensureMenuQrCodes(parsed.data.menuId, parsed.data.tableCount, parsed.data.branchId);
    await audit.log({ actorUserId: actor.session.user.id, actorRole: actor.role, action: "qr.ensure", targetType: "menu", targetId: parsed.data.menuId, next: { tableCount: parsed.data.tableCount, branchId: parsed.data.branchId ?? null } });
    return NextResponse.json({ ok: true, codes });
  } catch (error) {
    if (error instanceof Error && ["menu_not_found", "branch_not_found"].includes(error.message)) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: "qr_generation_failed" }, { status: 500 });
  }
}
