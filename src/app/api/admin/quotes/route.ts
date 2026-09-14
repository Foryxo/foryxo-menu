/**
 * Admin: issue a service quote for a request (spec §33).
 * Waiving requires admin role; all actions audited.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/domains/auth/server";
import { getDb } from "@/domains/db/client";
import { serviceRequests, serviceQuotes } from "@/domains/db/schema/index";
import { and, eq } from "drizzle-orm";
import { audit } from "@/domains/audit/log";
import { ipRateLimit } from "@/domains/auth/security";
import { resolveBusinessAttachments } from "@/domains/storage/attachments";

const schema = z.object({
  requestId: z.string().uuid(),
  amount: z.number().int().min(0).max(10_000_000_000),
  scope: z.string().min(1).max(500),
  attachments: z.array(z.object({ mediaId: z.string().uuid(), url: z.string().min(1).max(1000), filename: z.string().min(1).max(180), mime: z.string().max(100) })).max(6).default([]),
  waive: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "admin-quote", 60, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!["superadmin", "creator", "admin", "support"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  if (body.data.waive && !["superadmin", "admin"].includes(role)) {
    return NextResponse.json({ error: "waiver_requires_admin" }, { status: 403 });
  }

  const db = getDb();
  const [request] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, body.data.requestId))
    .limit(1);
  if (!request) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // The browser-provided URL, filename, and MIME are display hints only. A
  // quote must never attach another tenant's file or an arbitrary external URL.
  const attachments = await resolveBusinessAttachments(request.businessId, body.data.attachments.map(({ mediaId }) => mediaId));
  if (!attachments) {
    return NextResponse.json({ error: "invalid_attachment" }, { status: 400 });
  }

  // Replace any pending quote with the new one (no charging happens here).
  await db.delete(serviceQuotes).where(and(eq(serviceQuotes.requestId, request.id), eq(serviceQuotes.status, "pending")));
  const [quote] = await db
    .insert(serviceQuotes)
    .values({
      id: crypto.randomUUID(),
      requestId: request.id,
      amount: body.data.waive ? 0 : body.data.amount,
      scope: body.data.scope,
      attachments,
      status: body.data.waive ? "waived" : "pending",
    })
    .returning();

  await db
    .update(serviceRequests)
    .set({ status: "quoted", updatedAt: new Date() })
    .where(eq(serviceRequests.id, request.id));

  await audit.log({
    actorUserId: session.user.id,
    actorRole: role,
    action: body.data.waive ? "quote.waive" : "quote.issue",
    targetType: "service_request",
    targetId: request.id,
    businessId: request.businessId,
    next: { amount: quote.amount },
  });

  return NextResponse.json({ ok: true, quoteId: quote.id });
}
