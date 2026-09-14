/**
 * Email dispatch. queueEmail enqueues; deliverEmail performs actual sending.
 * When Redis/BullMQ is absent (dev), sends inline synchronously.
 */
import { env, isProd } from "@/config/env";
import { getRedis } from "@/domains/jobs/redis";

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function queueEmail(email: OutgoingEmail): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.lpush("queue:email", JSON.stringify(email));
    return;
  }
  // Dev: deliver inline
  await deliverEmail(email);
}

export async function deliverEmail(email: OutgoingEmail): Promise<void> {
  if (env.EMAIL_PROVIDER === "console") {
    if (isProd) throw new Error("EMAIL_DELIVERY_UNAVAILABLE");
    console.log(`[EMAIL:dev] → ${email.to} — ${email.subject}`);
    return;
  }
  if (!env.RESEND_API_KEY) throw new Error("EMAIL_DELIVERY_UNAVAILABLE");

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        ...(email.text ? { text: email.text } : {}),
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("EMAIL_DELIVERY_NETWORK_ERROR");
  }
  if (!response.ok) throw new Error(`EMAIL_DELIVERY_HTTP_${response.status}`);
  const result = await response.json().catch(() => null) as { id?: unknown } | null;
  if (typeof result?.id !== "string" || !result.id) {
    throw new Error("EMAIL_DELIVERY_INVALID_RESPONSE");
  }
}

/** Worker-side drain for the email queue (BullMQ processor calls this). */
export async function drainEmailQueue(max = 20): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  let count = 0;
  for (let i = 0; i < max; i++) {
    const raw = await redis.rpop("queue:email");
    if (!raw) break;
    try {
      await deliverEmail(JSON.parse(raw) as OutgoingEmail);
      count++;
    } catch (e) {
      console.error("[email] deliver failed", e);
      await redis.lpush("queue:email:dead", raw);
    }
  }
  return count;
}
