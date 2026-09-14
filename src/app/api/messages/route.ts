import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { auth } from "@/domains/auth/server";
import { getDb } from "@/domains/db/client";
import { businessMembers, serviceRequests, serviceRequestMessages } from "@/domains/db/schema/index";
import { ipRateLimit } from "@/domains/auth/security";
import { audit } from "@/domains/audit/log";

const attachment = z.object({ mediaId: z.string().uuid(), url: z.string().min(1).max(1000), filename: z.string().min(1).max(180), mime: z.string().max(100) });
const schema = z.object({ requestId: z.string().uuid(), body: z.string().min(1).max(3000), attachments: z.array(attachment).max(6).default([]) });
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "message-send", 120, 3600); if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const session = await auth.api.getSession({ headers: req.headers }); if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(()=>null)); if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const db = getDb(); const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, parsed.data.requestId)).limit(1); if (!request) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const role = (session.user as { role?: string }).role ?? "business"; const staff = ["superadmin", "creator", "admin", "support"].includes(role);
  if (!staff) { const [membership] = await db.select().from(businessMembers).where(and(eq(businessMembers.businessId, request.businessId), eq(businessMembers.userId, session.user.id))).limit(1); if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 }); }
  const [message] = await db.insert(serviceRequestMessages).values({ id: crypto.randomUUID(), requestId: request.id, authorUserId: session.user.id, body: parsed.data.body, attachments: parsed.data.attachments, isInternal: false }).returning();
  await db.update(serviceRequests).set({ updatedAt: new Date() }).where(eq(serviceRequests.id, request.id));
  await audit.log({ actorUserId: session.user.id, actorRole: role, action: "request.message", targetType: "service_request", targetId: request.id, businessId: request.businessId, next: { attachmentCount: parsed.data.attachments.length } });
  return NextResponse.json({ ok: true, id: message.id });
}
