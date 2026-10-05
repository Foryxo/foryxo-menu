import { NextResponse, type NextRequest } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { audit } from "@/domains/audit/log";
import { removesActiveSuperadmin } from "@/domains/admin/policies";
import { auth } from "@/domains/auth/server";
import { getDb } from "@/domains/db/client";
import { user } from "@/domains/db/schema/index";

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum(["superadmin", "creator", "admin", "finance", "support", "editor", "business", "consumer"]),
  isSuspended: z.boolean(),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session?.user || role !== "superadmin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  if (parsed.data.userId === session.user.id && parsed.data.role !== "superadmin") {
    return NextResponse.json({ error: "cannot_demote_self" }, { status: 409 });
  }
  if (parsed.data.userId === session.user.id && parsed.data.isSuspended) {
    return NextResponse.json({ error: "cannot_suspend_self" }, { status: 409 });
  }

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    let [before] = await tx.select().from(user).where(eq(user.id, parsed.data.userId)).limit(1);
    if (!before) return { error: "not_found" as const };

    if (removesActiveSuperadmin({
      currentRole: before.role,
      currentlySuspended: before.isSuspended,
      nextRole: parsed.data.role,
      nextSuspended: parsed.data.isSuspended,
    })) {
      // Serialize changes that remove an active superadmin. Without the row
      // lock, two admins could both observe a count of two and demote each other.
      await tx
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.role, "superadmin"), eq(user.isSuspended, false)))
        .for("update");
      [before] = await tx.select().from(user).where(eq(user.id, parsed.data.userId)).limit(1);
      if (!before) return { error: "not_found" as const };
      if (removesActiveSuperadmin({
        currentRole: before.role,
        currentlySuspended: before.isSuspended,
        nextRole: parsed.data.role,
        nextSuspended: parsed.data.isSuspended,
      })) {
        const [active] = await tx
          .select({ value: count() })
          .from(user)
          .where(and(eq(user.role, "superadmin"), eq(user.isSuspended, false)));
        if (Number(active?.value ?? 0) <= 1) {
          return { error: "cannot_remove_last_superadmin" as const };
        }
      }
    }

    await tx
      .update(user)
      .set({ role: parsed.data.role, isSuspended: parsed.data.isSuspended, updatedAt: new Date() })
      .where(eq(user.id, parsed.data.userId));
    return { before };
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.error === "not_found" ? 404 : 409 });
  }
  await audit.log({
    actorUserId: session.user.id,
    actorRole: role,
    action: "user.update_access",
    targetType: "user",
    targetId: parsed.data.userId,
    previous: { role: result.before.role, isSuspended: result.before.isSuspended },
    next: parsed.data,
  });
  return NextResponse.json({ ok: true });
}
