/**
 * Auth security: rate limiting + security event logging.
 * Redis-backed when available; in-memory fallback for dev (single process).
 */
import { getDb } from "@/domains/db/client";
import { securityEvents } from "@/domains/db/schema/index";
import { getRedis } from "@/domains/jobs/redis";

export interface RateResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
}

const memory = new Map<string, { count: number; reset: number }>();

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateResult> {
  const redis = getRedis();
  if (redis) {
    const k = `rl:${key}`;
    const count = await redis.incr(k);
    if (count === 1) await redis.expire(k, windowSec);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSec: count > limit ? windowSec : undefined,
    };
  }
  // In-memory fallback
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.reset < now) {
    memory.set(key, { count: 1, reset: now + windowSec * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }
  entry.count += 1;
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSec: entry.count > limit ? windowSec : undefined,
  };
}

/** OTP request throttle: 3 per 10 min per destination. */
export async function otpRateLimit(destination: string): Promise<RateResult> {
  return rateLimit(`otp:${destination}`, 3, 600);
}

/** Generic API throttle by IP. */
export async function ipRateLimit(ip: string, bucket: string, limit: number, windowSec: number) {
  return rateLimit(`ip:${bucket}:${ip}`, limit, windowSec);
}

export async function recordSecurityEvent(event: {
  userId?: string;
  type: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const db = getDb();
    await db.insert(securityEvents).values({
      id: crypto.randomUUID(),
      userId: event.userId,
      type: event.type,
      ip: event.ip,
      userAgent: event.userAgent,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    });
  } catch (e) {
    // Never let logging break the request; surface via console for ops.
    console.error("[security] failed to record event", e);
  }
}
