/**
 * Phone OTP endpoints (spec §25): send + verify.
 * Codes are hashed at rest; generic errors prevent enumeration;
 * rate limited per destination and per IP.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createHash, randomInt } from "node:crypto";
import { eq, and, desc, gt, lt, ne, sql } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import { verification, user } from "@/domains/db/schema/index";
import { getSmsProvider } from "@/domains/auth/sms";
import { otpRateLimit, ipRateLimit, recordSecurityEvent } from "@/domains/auth/security";
import { normalizeIranPhone } from "@/domains/i18n/normalize";
import { env, isProd, flags } from "@/config/env";
import { auth } from "@/domains/auth/server";
import { serializeSignedCookie } from "better-call";
import { getRequestGeography } from "@/domains/geo/location";

function hashOtp(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}:${env.AUTH_SECRET}`).digest("hex");
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: "send" | "verify";
    phone?: string;
    code?: string;
    name?: string;
  };

  if (!flags.phoneOtp) {
    return NextResponse.json({ error: "phone_otp_disabled" }, { status: 403 });
  }
  const geography = getRequestGeography(req.headers);
  if (isProd && geography.countryCode && !geography.isIran) {
    return NextResponse.json({ error: "sms_region_unavailable" }, { status: 403 });
  }

  const ip = clientIp(req);
  const ipCheck = await ipRateLimit(ip, "phone-otp", 10, 600);
  if (!ipCheck.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const normalized = body.phone ? normalizeIranPhone(body.phone) : null;
  if (!normalized) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const db = getDb();

  if (body.action === "send") {
    const destLimit = await otpRateLimit(`phone:${normalized}`);
    if (!destLimit.allowed) {
      return NextResponse.json({ error: "rate_limited" }, {
        status: 429,
        headers: { "Retry-After": String(destLimit.retryAfterSec ?? 600) },
      });
    }

    const code = String(randomInt(100000, 1_000_000));
    const verificationId = crypto.randomUUID();

    await db.insert(verification).values({
      id: verificationId,
      identifier: normalized,
      value: hashOtp(normalized, code),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      purpose: "otp",
    });

    const result = await Promise.resolve()
      .then(() => getSmsProvider().sendOtp(normalized, code))
      .catch(() => ({ ok: false }));
    if (!result.ok) {
      await db.delete(verification).where(eq(verification.id, verificationId));
      await recordSecurityEvent({ type: "otp_send_failed", metadata: { phone: normalized.slice(-4) } });
      return NextResponse.json({ error: "sms_failed" }, { status: 502 });
    }
    // Only the latest delivered code may be used.
    await db.delete(verification).where(and(eq(verification.identifier, normalized), eq(verification.purpose, "otp"), ne(verification.id, verificationId)));
    await recordSecurityEvent({ type: "otp_sent", metadata: { channel: "sms", phone: normalized.slice(-4) } });

    return NextResponse.json({
      ok: true,
      devCode: env.AUTH_DEV_OTP && !isProd ? code : undefined,
    });
  }

  if (body.action === "verify") {
    if (!body.code || !/^\d{6}$/.test(body.code)) {
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    }

    // Only the latest live code is accepted; prior sends cannot extend a login window.
    const newest = (await db
      .select()
      .from(verification)
      .where(and(eq(verification.identifier, normalized), eq(verification.purpose, "otp")))
      .orderBy(desc(verification.createdAt))
      .limit(1))[0];

    const now = Date.now();
    if (!newest || newest.expiresAt.getTime() <= now || newest.attempts >= 5) {
      return NextResponse.json({ error: "expired" }, { status: 401 });
    }
    if (newest.value !== hashOtp(normalized, body.code)) {
      await db
        .update(verification)
        .set({ attempts: sql`${verification.attempts} + 1` })
        .where(and(eq(verification.id, newest.id), lt(verification.attempts, 5)));
      await recordSecurityEvent({ type: "otp_failed", metadata: { channel: "sms" } });
      return NextResponse.json({ error: "invalid_code" }, { status: 401 });
    }
    const consumed = await db.delete(verification)
      .where(and(eq(verification.id, newest.id), eq(verification.value, newest.value), gt(verification.expiresAt, new Date()), lt(verification.attempts, 5)))
      .returning({ id: verification.id });
    if (consumed.length === 0) return NextResponse.json({ error: "invalid_code" }, { status: 401 });

    // Find or create user by phone.
    let dbUser = (await db.select().from(user).where(eq(user.phone, normalized)).limit(1))[0];
    if (!dbUser) {
      const [created] = await db
        .insert(user)
        .values({
          id: crypto.randomUUID(),
          name: body.name?.slice(0, 60) || normalized.slice(-4),
          email: `${normalized}@phone.foryxo.local`, // placeholder email for phone-first users
          emailVerified: false,
          phone: normalized,
          phoneVerified: true,
        })
        .returning();
      dbUser = created;
    }
    if (dbUser.isSuspended) {
      return NextResponse.json({ error: "suspended" }, { status: 403 });
    }

    const authContext = await auth.$context;
    const createdSession = await authContext.internalAdapter.createSession(dbUser.id);
    if (!createdSession) {
      await recordSecurityEvent({ userId: dbUser.id, type: "login_failed", metadata: { method: "phone_otp", reason: "session_create_failed" } });
      return NextResponse.json({ error: "session_failed" }, { status: 500 });
    }

    const sessionCookie = await serializeSignedCookie(
      authContext.authCookies.sessionToken.name,
      createdSession.token,
      authContext.secret,
      {
        ...authContext.authCookies.sessionToken.attributes,
        maxAge: authContext.sessionConfig.expiresIn,
      },
    );

    await recordSecurityEvent({ userId: dbUser.id, type: "login_success", metadata: { method: "phone_otp" } });
    const response = NextResponse.json({ ok: true, userId: dbUser.id });
    response.headers.append("set-cookie", sessionCookie);
    return response;
  }

  return NextResponse.json({ error: "bad_request" }, { status: 400 });
}
