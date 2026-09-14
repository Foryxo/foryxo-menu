/**
 * Builder submission (spec §24 step 10): requires authentication.
 * Creates the business (or reuses), the project with an immutable
 * configuration snapshot, and an open quote request. No pricing changes
 * silently after submission.
 */
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import {
  builderDrafts,
  businesses,
  businessMembers,
  businessSettings,
  onboardingChecklist,
  projects,
  projectStatusHistory,
  serviceRequests,
} from "@/domains/db/schema/index";
import { auth } from "@/domains/auth/server";
import { builderConfigSchema, invalidBuilderSteps } from "@/domains/builder/config";
import { calculateDeliveryEstimate } from "@/domains/builder/delivery";
import { calculateEstimate } from "@/domains/pricing/calculator";
import { audit } from "@/domains/audit/log";
import { isSafeSlug, slugify, randomId, sanitizeNote } from "@/lib/utils";
import { ipRateLimit } from "@/domains/auth/security";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const rl = await ipRateLimit(ip, "builder-submit", 5, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const db = getDb();

  // Load the draft (user-attached or anonymous via cookie).
  const store = await cookies();
  const anonId = store.get("foryxo_anon")?.value ?? null;
  const ownDraft = (await db.select().from(builderDrafts).where(eq(builderDrafts.userId, userId)).limit(1))[0];
  const anonymousDraft = !ownDraft && anonId
    ? (await db.select().from(builderDrafts).where(and(eq(builderDrafts.anonId, anonId), isNull(builderDrafts.userId))).limit(1))[0]
    : undefined;
  const draft = ownDraft ?? anonymousDraft;

  if (!draft) {
    return NextResponse.json({ error: "no_draft" }, { status: 400 });
  }

  const parsed = builderConfigSchema.safeParse(draft.config);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_config" }, { status: 400 });
  }
  const config = parsed.data;

  const invalidSteps = invalidBuilderSteps(config);
  const { demoId, businessType, management } = config;
  if (invalidSteps.length || !demoId || !businessType || !management) {
    return NextResponse.json({ error: "incomplete_config", invalidSteps }, { status: 422 });
  }

  // Find or create the business for this user.
  let biz = (
    await db.select().from(businesses).where(eq(businesses.ownerUserId, userId)).limit(1)
  )[0];

  if (!biz) {
    const brandName = sanitizeNote(config.brandName ?? "My Business", 60) || "My Business";
    let slug = slugify(config.brandNameEn || brandName);
    if (!isSafeSlug(slug)) slug = `biz-${randomId(6)}`;
    // Ensure uniqueness
    const clash = (await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.slug, slug)).limit(1))[0];
    if (clash) slug = `${slug}-${randomId(4)}`;

    const [created] = await db
      .insert(businesses)
      .values({
        id: crypto.randomUUID(),
        ownerUserId: userId,
        name: brandName,
        nameEn: config.brandNameEn ? sanitizeNote(config.brandNameEn, 80) : null,
        slug,
        businessType,
        status: "prospect",
      })
      .returning();
    biz = created;
    await db.insert(businessMembers).values({
      id: crypto.randomUUID(),
      businessId: biz.id,
      userId,
      role: "owner",
    });
    await db.insert(businessSettings).values({
      businessId: biz.id,
      locale: config.languages[0] === "en" ? "en" : "fa",
    });
  }

  // Idempotency: one active project per business from the builder.
  const existingProject = (
    await db
      .select()
      .from(projects)
      .where(and(eq(projects.businessId, biz.id)))
      .limit(1)
  )[0];
  if (existingProject && existingProject.status !== "cancelled") {
    return NextResponse.json({ ok: true, projectId: existingProject.id, businessId: biz.id, existing: true });
  }

  const estimate = calculateEstimate({
    demoId,
    businessType,
    languages: config.languages,
    features: config.features,
    contentOption: config.contentOption ?? "later",
    domainOption: config.domainOption ?? "none",
    management,
    itemCount: config.itemCount ?? undefined,
    photoCount: config.photoCount ?? undefined,
    qrTableCount: config.qrTableCount,
    branchCount: config.branchCount,
    branchMenuMode: config.branchMenuMode,
  });

  const [project] = await db
    .insert(projects)
    .values({
      id: crypto.randomUUID(),
      businessId: biz.id,
      demoId,
      configuration: { ...config, estimateAtSubmission: estimate, deliveryEstimateAtSubmission: calculateDeliveryEstimate(config) },
      status: "submitted",
    })
    .returning();

  await db.insert(projectStatusHistory).values({
    id: crypto.randomUUID(),
    projectId: project.id,
    toStatus: "submitted",
    actorUserId: userId,
  });

  // Open quote request for the admin team.
  await db.insert(serviceRequests).values({
    id: crypto.randomUUID(),
    businessId: biz.id,
    projectId: project.id,
    number: `SR-Q-${randomId(4).toUpperCase()}`,
    category: "other",
    title: "درخواست برآورد ساخت منو / Menu build quote request",
    body: `دمو: ${config.demoId}؛ زبان‌ها: ${config.languages.join(", ")}؛ امکانات: ${config.features.join(", ") || "بدون افزونه"}؛ تعداد QR میز: ${config.features.includes("table_qr") ? config.qrTableCount : 0}؛ شعبه‌ها: ${config.features.includes("multiple_branches") ? `${config.branchCount} (${config.branchMenuMode}/${config.branchSelectionMode})` : "۱"}؛ روش تحویل: ${config.features.includes("direct_order") ? config.fulfillmentTypes.join(", ") : "ندارد"}؛ اعلان سفارش: ${config.orderNotificationChannels.join(", ")}؛ مدیریت: ${config.management}؛ محتوا: ${config.contentOption ?? "بعداً"}؛ تعداد عکس برای ویرایش: ${config.contentOption === "photos" ? config.photoCount ?? 0 : 0}؛ دامنه: ${config.domainOption ?? "بدون دامنه"}\n\nDemo: ${config.demoId}; languages: ${config.languages.join(", ")}; features: ${config.features.join(", ") || "none"}; table QR codes: ${config.features.includes("table_qr") ? config.qrTableCount : 0}; branches: ${config.features.includes("multiple_branches") ? `${config.branchCount} (${config.branchMenuMode}/${config.branchSelectionMode})` : "1"}; fulfillment: ${config.features.includes("direct_order") ? config.fulfillmentTypes.join(", ") : "none"}; order alerts: ${config.orderNotificationChannels.join(", ")}; management: ${config.management}; content: ${config.contentOption ?? "later"}; food photos to edit: ${config.contentOption === "photos" ? config.photoCount ?? 0 : 0}; domain: ${config.domainOption ?? "none"}`,
    urgency: "normal",
    status: "open",
    createdBy: userId,
  });

  // Seed the onboarding checklist.
  const steps = [
    "account_verified", "business_info", "demo_selected", "logo",
    "color", "existing_menu", "photos", "languages", "domain", "payment",
    "preview_approval", "published",
  ];
  await db.insert(onboardingChecklist).values(
    steps.map((s) => ({
      id: crypto.randomUUID(),
      businessId: biz.id,
      step: s,
      completed: s === "account_verified" || s === "demo_selected",
      completedAt: s === "account_verified" || s === "demo_selected" ? new Date() : null,
    })),
  );

  await audit.log({
    actorUserId: userId,
    action: "project.submit",
    targetType: "project",
    targetId: project.id,
    businessId: biz.id,
    next: { demoId: config.demoId, estimateInitial: estimate.initialTotal },
  });

  // Attach anonymous draft to user and mark consumed.
  if (anonymousDraft) {
    await db
      .update(builderDrafts)
      .set({ userId, anonId: null })
      .where(eq(builderDrafts.id, draft.id));
  }

  return NextResponse.json({ ok: true, projectId: project.id, businessId: biz.id });
}
