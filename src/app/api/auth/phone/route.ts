/**
 * Phone OTP endpoints (spec §25): send + verify.
 * Codes are hashed at rest; generic errors prevent enumeration;
 * rate limited per destination and per IP.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createHash, randomInt } from "node:crypto";
import { eq, and } from "drizzle-orm";
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
      // Generic response to reduce enumeration; still throttled.
      return NextResponse.json({ ok: true, throttled: true });
    }

    // Dev convenience: deterministic code, never in prod.
    const code =
      env.AUTH_DEV_OTP && !isProd
        ? String(randomInt(100000, 999999))
        : String(randomInt(100000, 999999));

    await db.insert(verification).values({
      id: crypto.randomUUID(),
      identifier: normalized,
      value: hashOtp(normalized, code),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      purpose: "otp",
    });

    const sms = getSmsProvider();
    const result = await sms.sendOtp(normalized, code);
    if (!result.ok) {
      await recordSecurityEvent({ type: "otp_send_failed", metadata: { phone: normalized.slice(-4) } });
      return NextResponse.json({ error: "sms_failed" }, { status: 502 });
    }
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

    // Attempt limiting per identifier: max 5 tries per code row.
    const rows = await db
      .select()
      .from(verification)
      .where(and(eq(verification.identifier, normalized), eq(verification.purpose, "otp")))
      .limit(5);

    const now = Date.now();
    const valid = rows.find(
      (r) => r.expiresAt.getTime() > now && r.attempts < 5 && r.value === hashOtp(normalized, body.code!),
    );

    // Burn an attempt on the newest live row even on failure.
    const newest = rows.filter((r) => r.expiresAt.getTime() > now).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    if (!valid && newest) {
      await db
        .update(verification)
        .set({ attempts: newest.attempts + 1 })
        .where(eq(verification.id, newest.id));
      await recordSecurityEvent({ type: "otp_failed", metadata: { channel: "sms" } });
      return NextResponse.json({ error: "invalid_code" }, { status: 401 });
    }
    if (!valid) {
      return NextResponse.json({ error: "expired" }, { status: 401 });
    }

    // Success: consume all rows for this identifier.
    await db.delete(verification).where(and(eq(verification.identifier, normalized), eq(verification.purpose, "otp")));

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
