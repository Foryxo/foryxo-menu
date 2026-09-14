import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/domains/auth/server";
import { audit } from "@/domains/audit/log";
import { getDb } from "@/domains/db/client";
import { media } from "@/domains/db/schema/index";
import { sanitizeNote } from "@/lib/utils";

const updateSchema = z.object({
  mediaId: z.string().min(1).max(100),
  workflowStatus: z.enum(["received", "editing", "ready", "placed", "needs_info"]),
  creatorNotes: z.string().max(1000).optional().default(""),
});

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "business";
  if (!["superadmin", "creator"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const db = getDb();
  const [current] = await db.select().from(media).where(eq(media.id, parsed.data.mediaId)).limit(1);
  if (!current || current.kind !== "food_photo") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [updated] = await db
    .update(media)
    .set({
      workflowStatus: parsed.data.workflowStatus,
      creatorNotes: sanitizeNote(parsed.data.creatorNotes, 1000) || null,
      updatedAt: new Date(),
    })
    .where(eq(media.id, current.id))
    .returning();

  await audit.log({
    actorUserId: session.user.id,
    action: "media.workflow.update",
    targetType: "media",
    targetId: current.id,
    businessId: current.businessId ?? undefined,
    previous: { workflowStatus: current.workflowStatus },
    next: { workflowStatus: updated.workflowStatus },
  });

  return NextResponse.json({ ok: true, asset: updated });
}
