/**
 * Builder draft API: GET (load), PATCH (save step), DELETE (reset).
 * Anonymous drafts live under an httpOnly anon cookie; when the visitor
 * signs in, the draft attaches to their user id (spec §24).
 */
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import { builderDrafts } from "@/domains/db/schema/index";
import { auth } from "@/domains/auth/server";
import { builderConfigSchema, EMPTY_CONFIG, type BuilderConfig } from "@/domains/builder/config";
import { calculateEstimate } from "@/domains/pricing/calculator";
import { randomId } from "@/lib/utils";

const ANON_COOKIE = "foryxo_anon";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

async function resolveDraftOwner(req: NextRequest): Promise<{ userId: string | null; anonId: string | null; setCookie?: string }> {
  const session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
  const store = await cookies();
  let anon = store.get(ANON_COOKIE)?.value ?? null;
  if (session?.user) return { userId: session.user.id, anonId: anon };
  if (!anon) {
    anon = randomId(16);
    return { userId: null, anonId: anon, setCookie: anon };
  }
  return { userId: null, anonId: anon };
}

async function findDraft(db: ReturnType<typeof getDb>, userId: string | null, anonId: string | null) {
  if (userId) {
    const own = (await db.select().from(builderDrafts).where(eq(builderDrafts.userId, userId)).limit(1))[0];
    if (own) return own;
  }
  if (!anonId) return undefined;
  return (await db.select().from(builderDrafts).where(and(eq(builderDrafts.anonId, anonId), isNull(builderDrafts.userId))).limit(1))[0];
}

export async function GET(req: NextRequest) {
  const owner = await resolveDraftOwner(req);
  const db = getDb();
  const row = await findDraft(db, owner.userId, owner.anonId);

  const config = (row?.config as BuilderConfig) ?? EMPTY_CONFIG;
  const estimate = calculateEstimate({
    demoId: config.demoId ?? "",
    businessType: config.businessType ?? "other",
    languages: config.languages,
    features: config.features,
    contentOption: config.contentOption ?? "later",
    domainOption: config.domainOption ?? "none",
    management: config.management ?? "managed",
    itemCount: config.itemCount ?? undefined,
    photoCount: config.photoCount ?? undefined,
    qrTableCount: config.qrTableCount,
    branchCount: config.branchCount,
    branchMenuMode: config.branchMenuMode,
  });

  const res = NextResponse.json({
    ok: true,
    step: row?.step ?? 1,
    config,
    estimate,
  });
  if (owner.setCookie) {
    res.cookies.set(ANON_COOKIE, owner.setCookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }
  return res;
}

export async function PATCH(req: NextRequest) {
  const owner = await resolveDraftOwner(req);
  const body = (await req.json().catch(() => ({}))) as {
    step?: number;
    config?: unknown;
    itemCount?: number;
    photoCount?: number;
  };

  const db = getDb();
  const existing = await findDraft(db, owner.userId, owner.anonId);

  const baseConfig = (existing?.config as BuilderConfig) ?? EMPTY_CONFIG;
  const parsedConfig = builderConfigSchema.safeParse({ ...baseConfig, ...(body.config as object) });
  if (!parsedConfig.success) {
    return NextResponse.json({ error: "invalid_config", issues: parsedConfig.error.flatten() }, { status: 400 });
  }
  const config = parsedConfig.data;

  const estimate = calculateEstimate({
    demoId: config.demoId ?? "",
    businessType: config.businessType ?? "other",
    languages: config.languages,
    features: config.features,
    contentOption: config.contentOption ?? "later",
    domainOption: config.domainOption ?? "none",
    management: config.management ?? "managed",
    itemCount: body.itemCount ?? config.itemCount ?? undefined,
    photoCount: body.photoCount ?? config.photoCount ?? undefined,
    qrTableCount: config.qrTableCount,
    branchCount: config.branchCount,
    branchMenuMode: config.branchMenuMode,
  });

  const step = Math.max(1, Math.min(10, Math.floor(body.step ?? existing?.step ?? 1)));

  if (existing) {
    await db
      .update(builderDrafts)
      .set({ step, config, estimate: estimate.initialTotal, updatedAt: new Date(), ...(owner.userId && !existing.userId ? { userId: owner.userId, anonId: null } : {}) })
      .where(eq(builderDrafts.id, existing.id));
  } else {
    await db.insert(builderDrafts).values({
      id: crypto.randomUUID(),
      userId: owner.userId,
      anonId: owner.userId ? null : owner.anonId,
      step,
      config,
      estimate: estimate.initialTotal,
    });
  }

  const res = NextResponse.json({ ok: true, step, estimate });
  if (owner.setCookie) {
    res.cookies.set(ANON_COOKIE, owner.setCookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }
  return res;
}
