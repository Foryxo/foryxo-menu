/**
 * Service request creation (spec §33). Tenant-scoped; sanitized; rate limited.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/domains/auth/server";
import { requireMyBusiness } from "@/domains/dashboard/data";
import { getDb } from "@/domains/db/client";
import { serviceRequests } from "@/domains/db/schema/index";
import { ipRateLimit } from "@/domains/auth/security";
import { audit } from "@/domains/audit/log";
import { randomId } from "@/lib/utils";

const CATEGORIES = [
  "price_change", "add_product", "remove_product", "photo_change", "add_category",
  "add_language", "design_change", "new_feature", "domain_config", "hosting_issue",
  "new_branch", "ordering_integration", "payment_integration", "seo_update",
  "content_entry", "urgent_support", "other",
] as const;

const schema = z.object({
  businessId: z.string().uuid(),
  category: z.enum(CATEGORIES),
  title: z.string().min(3).max(120),
  body: z.string().min(5).max(2000),
  urgency: z.enum(["normal", "urgent"]).default("normal"),
  preferredDate: z.string().max(10).optional(),
  locale: z.enum(["fa", "en"]).default("fa"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "svc-request", 20, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const membership = await requireMyBusiness(session.user.id, parsed.data.businessId);
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const db = getDb();
  const [row] = await db
    .insert(serviceRequests)
    .values({
      id: crypto.randomUUID(),
      businessId: membership.business.id,
      number: `SR-${randomId(6).toUpperCase()}`,
      category: parsed.data.category,
      title: parsed.data.title,
      body: parsed.data.body,
      urgency: parsed.data.urgency,
      preferredDate: parsed.data.preferredDate,
      status: "open",
      createdBy: session.user.id,
    })
    .returning();

  await audit.log({
    actorUserId: session.user.id,
    action: "request.create",
    targetType: "service_request",
    targetId: row.id,
    businessId: membership.business.id,
  });

  return NextResponse.json({ ok: true, id: row.id, number: row.number });
}
