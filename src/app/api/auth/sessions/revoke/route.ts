/**
 * Session revocation. Users may only revoke their own sessions.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/domains/auth/server";
import { getDb } from "@/domains/db/client";
import { session } from "@/domains/db/schema/index";
import { eq, and } from "drizzle-orm";
import { audit } from "@/domains/audit/log";

const schema = z.object({ sessionId: z.string().min(6).max(80) });

export async function POST(req: NextRequest) {
  const s = await auth.api.getSession({ headers: req.headers });
  if (!s?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const db = getDb();
  const target = (
    await db.select().from(session).where(eq(session.id, body.data.sessionId)).limit(1)
  )[0];
  if (!target || target.userId !== s.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await db
    .update(session)
    .set({ revokedAt: new Date() })
    .where(and(eq(session.id, body.data.sessionId), eq(session.userId, s.user.id)));

  await audit.log({
    actorUserId: s.user.id,
    action: "session.revoke",
    targetType: "session",
    targetId: body.data.sessionId,
  });

  return NextResponse.json({ ok: true });
}
