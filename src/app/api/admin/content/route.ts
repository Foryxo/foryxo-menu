import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/domains/auth/server";
import { getDb } from "@/domains/db/client";
import { blogPosts, managedDemos, portfolioProjects } from "@/domains/db/schema/index";
import { ipRateLimit } from "@/domains/auth/security";
import { audit } from "@/domains/audit/log";
import { canPublishManagedContent } from "@/domains/admin/policies";

const slug = z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const publicUrl = z.string().min(1).max(1000).refine((value) => value.startsWith("/") || /^https:\/\//i.test(value), "invalid_url");
const createSchema = z.discriminatedUnion("entity", [
  z.object({ action: z.literal("create"), entity: z.literal("portfolio"), slug, titleFa: z.string().min(2).max(160), titleEn: z.string().min(2).max(160), summaryFa: z.string().min(5).max(1000), summaryEn: z.string().min(5).max(1000), clientName: z.string().max(160).optional(), serviceFa: z.string().max(160).optional(), serviceEn: z.string().max(160).optional(), liveUrl: publicUrl, coverImageUrl: publicUrl.optional(), status: z.enum(["draft", "published"]).default("draft"), featured: z.boolean().default(false) }),
  z.object({ action: z.literal("create"), entity: z.literal("demo"), slug, titleFa: z.string().min(2).max(160), titleEn: z.string().min(2).max(160), descriptionFa: z.string().min(5).max(1000), descriptionEn: z.string().min(5).max(1000), previewImageUrl: publicUrl, liveMenuUrl: publicUrl, status: z.enum(["draft", "published"]).default("draft") }),
  z.object({ action: z.literal("create"), entity: z.literal("blog"), locale: z.enum(["fa", "en"]), slug, title: z.string().min(3).max(180), excerpt: z.string().min(10).max(500), content: z.string().min(30).max(40000), category: z.string().max(100).optional(), heroUrl: publicUrl.optional(), seoTitle: z.string().max(180).optional(), seoDescription: z.string().max(500).optional(), status: z.enum(["draft", "published"]).default("draft") }),
]);
const statusSchema = z.object({ action: z.literal("setStatus"), entity: z.enum(["portfolio", "demo", "blog"]), id: z.string().uuid(), status: z.enum(["draft", "published", "archived"]) });

async function staff(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  return session?.user && ["superadmin", "creator", "admin", "editor"].includes(role) ? { session, role } : null;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0"; const rl = await ipRateLimit(ip, "admin-content", 100, 3600); if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const actor = await staff(req); if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const raw = await req.json().catch(()=>null); const db = getDb(); let targetId = ""; let entity = "";
  const statusParsed = statusSchema.safeParse(raw);
  if (statusParsed.success) {
    if (statusParsed.data.status === "published" && !canPublishManagedContent(actor.role)) {
      return NextResponse.json({ error: "publishing_requires_admin" }, { status: 403 });
    }
    const now = new Date();
    let updated: { id: string } | undefined;
    if (statusParsed.data.entity === "portfolio") {
      [updated] = await db
        .update(portfolioProjects)
        .set({ status: statusParsed.data.status, updatedAt: now, ...(statusParsed.data.status === "published" ? { launchedAt: now } : {}) })
        .where(eq(portfolioProjects.id, statusParsed.data.id))
        .returning({ id: portfolioProjects.id });
    } else if (statusParsed.data.entity === "demo") {
      [updated] = await db
        .update(managedDemos)
        .set({ status: statusParsed.data.status, updatedAt: now })
        .where(eq(managedDemos.id, statusParsed.data.id))
        .returning({ id: managedDemos.id });
    } else {
      [updated] = await db
        .update(blogPosts)
        .set({
          status: statusParsed.data.status,
          updatedAt: now,
          ...(statusParsed.data.status === "published"
            ? { publishedAt: now, reviewedAt: now, reviewedBy: actor.session.user.id }
            : {}),
        })
        .where(eq(blogPosts.id, statusParsed.data.id))
        .returning({ id: blogPosts.id });
    }
    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    targetId = statusParsed.data.id; entity = statusParsed.data.entity;
  } else {
    const parsed = createSchema.safeParse(raw); if (!parsed.success) return NextResponse.json({ error: "invalid_input", fields: parsed.error.flatten() }, { status: 400 });
    const item = parsed.data; entity = item.entity;
    if (item.status === "published" && !canPublishManagedContent(actor.role)) {
      return NextResponse.json({ error: "publishing_requires_admin" }, { status: 403 });
    }
    if (item.entity === "portfolio") { const [row] = await db.insert(portfolioProjects).values({ ...item, id: crypto.randomUUID(), launchedAt: item.status === "published" ? new Date() : null, createdBy: actor.session.user.id }).returning(); targetId = row.id; }
    else if (item.entity === "demo") { const [row] = await db.insert(managedDemos).values({ ...item, id: crypto.randomUUID(), createdBy: actor.session.user.id }).returning(); targetId = row.id; }
    else { const publishedAt = item.status === "published" ? new Date() : null; const [row] = await db.insert(blogPosts).values({ id: crypto.randomUUID(), locale: item.locale, slug: item.slug, title: item.title, excerpt: item.excerpt, content: item.content, author: actor.session.user.name || "Foryxo Menu", status: item.status, category: item.category, heroMediaId: item.heroUrl, seoTitle: item.seoTitle, seoDescription: item.seoDescription, publishedAt, reviewedAt: publishedAt, reviewedBy: publishedAt ? actor.session.user.id : null }).returning(); targetId = row.id; }
  }
  await audit.log({ actorUserId: actor.session.user.id, actorRole: actor.role, action: `content.${raw.action}`, targetType: entity, targetId });
  return NextResponse.json({ ok: true, id: targetId });
}
