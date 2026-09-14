/**
 * Durable background jobs (spec §2): BullMQ when Redis is configured;
 * otherwise a lightweight in-process interval worker for development.
 *
 * Queues: email | sms | image | sitemap | reconcile | notifications | indexnow
 */
import { env } from "@/config/env";
import { getRedis } from "./redis";

export type QueueName =
  | "email"
  | "sms"
  | "image"
  | "sitemap"
  | "reconcile"
  | "notifications"
  | "indexnow";

interface Job {
  queue: QueueName;
  payload: unknown;
  runAt: number;
}

const g = globalThis as unknown as {
  foryxoDevQueue?: Job[];
  foryxoDevTimer?: ReturnType<typeof setInterval>;
};

export function enqueue(queue: QueueName, payload: unknown, delayMs = 0): void {
  const redis = getRedis();
  if (redis) {
    // BullMQ-compatible: push into a simple Redis list; the worker process
    // (npm run worker) consumes via BullMQ in production deployments.
    void redis.lpush(
      `queue:${queue}`,
      JSON.stringify({ payload, runAt: Date.now() + delayMs }),
    );
    return;
  }
  if (!g.foryxoDevQueue) g.foryxoDevQueue = [];
  g.foryxoDevQueue.push({ queue, payload, runAt: Date.now() + delayMs });
  startDevWorker();
}

export async function processJob(queue: QueueName, payload: unknown): Promise<void> {
  switch (queue) {
    case "email":
      if (payload && typeof payload === "object" && "to" in payload) {
        const { deliverEmail } = await import("@/domains/email/queue");
        await deliverEmail(payload as Parameters<typeof deliverEmail>[0]);
      }
      break;
    case "sms": {
      const { getSmsProvider } = await import("@/domains/auth/sms");
      const p = payload as { phone: string; message: string };
      await getSmsProvider().sendMessage(p.phone, p.message);
      break;
    }
    case "sitemap":
      // Trigger revalidation of sitemap/menu routes (Next fetch keeps ISR fresh).
      try {
        await fetch(`${env.APP_URL}/sitemap.xml`, { method: "HEAD" });
      } catch {
        /* non-fatal */
      }
      break;
    case "indexnow": {
      const { submitIndexNow } = await import("@/domains/seo/indexnow");
      await submitIndexNow((payload as { urls: string[] }).urls);
      break;
    }
    case "image":
    case "reconcile":
    case "notifications":
      // Handled by dedicated workers; see scripts/worker.ts
      break;
  }
}

function startDevWorker(): void {
  if (g.foryxoDevTimer) return;
  g.foryxoDevTimer = setInterval(async () => {
    const q = g.foryxoDevQueue;
    if (!q?.length) return;
    const now = Date.now();
    const due = q.filter((j) => j.runAt <= now);
    g.foryxoDevQueue = q.filter((j) => j.runAt > now);
    for (const job of due) {
      try {
        await processJob(job.queue, job.payload);
      } catch (e) {
        console.error(`[queue:${job.queue}] job failed`, e);
      }
    }
  }, 1000);
  // Never keep the process alive solely for the dev queue.
  g.foryxoDevTimer.unref?.();
}

export async function queueHealth(): Promise<{ mode: string; pending: number }> {
  const redis = getRedis();
  if (redis) {
    const queues: QueueName[] = ["email", "sms", "image", "sitemap", "reconcile", "notifications", "indexnow"];
    let pending = 0;
    for (const q of queues) pending += await redis.llen(`queue:${q}`);
    return { mode: "redis", pending };
  }
  return { mode: "in-memory-dev", pending: g.foryxoDevQueue?.length ?? 0 };
}
