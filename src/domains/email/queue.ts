/**
 * Email dispatch. queueEmail enqueues; deliverEmail performs actual sending.
 * When Redis/BullMQ is absent (dev), sends inline synchronously.
 */
import nodemailer, { type Transporter } from "nodemailer";
import { env, isProd } from "@/config/env";
import { getRedis } from "@/domains/jobs/redis";

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (env.EMAIL_PROVIDER !== "smtp") return null;
  if (!env.EMAIL_SMTP_HOST || !env.EMAIL_SMTP_USER || !env.EMAIL_SMTP_PASS) {
    throw new Error("EMAIL_DELIVERY_UNAVAILABLE");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_SMTP_HOST,
      port: env.EMAIL_SMTP_PORT,
      secure: env.EMAIL_SMTP_PORT === 465,
      auth: env.EMAIL_SMTP_USER
        ? { user: env.EMAIL_SMTP_USER, pass: env.EMAIL_SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
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
  const tx = getTransporter();
  if (!tx) {
    if (isProd) throw new Error("EMAIL_DELIVERY_UNAVAILABLE");
    console.log(`[EMAIL:dev] → ${email.to} — ${email.subject}`);
    return;
  }
  const result = await tx.sendMail({
    from: env.EMAIL_FROM,
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    replyTo: email.replyTo,
  });
  if (!result.accepted?.some((address) => address.toLowerCase() === email.to.toLowerCase())) {
    throw new Error("EMAIL_RECIPIENT_REJECTED");
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
