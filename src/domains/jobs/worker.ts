/**
 * Redis-mode queue worker loop (consumes the lists pushed by enqueue()).
 */
import { getRedis } from "./redis";
import { processJob, type QueueName } from "./queues";

const QUEUES: QueueName[] = ["email", "sms", "image", "sitemap", "reconcile", "notifications", "indexnow"];

export async function drainAll(): Promise<never> {
  const redis = getRedis();
  if (!redis) throw new Error("worker requires REDIS_URL");

  console.log(`[worker] draining ${QUEUES.join(", ")}`);
  // Each queue round-robin, blocking pop with 5s timeout.
  while (true) {
    let worked = false;
    for (const q of QUEUES) {
      const raw = await redis.rpop(`queue:${q}`);
      if (!raw) continue;
      worked = true;
      try {
        const { payload } = JSON.parse(raw) as { payload: unknown; runAt: number };
        await processJob(q, payload);
      } catch (e) {
        console.error(`[queue:${q}] job failed`, e);
        // Requeue with backoff (max 5 attempts), else record failure.
        const job = JSON.parse(raw) as { payload: unknown; runAt: number; attempts?: number };
        const attempts = (job.attempts ?? 0) + 1;
        if (attempts <= 5) {
          await redis.lpush(
            `queue:${q}`,
            JSON.stringify({ ...job, attempts, runAt: Date.now() + 2 ** attempts * 1000 }),
          );
        } else {
          const { getDb } = await import("@/domains/db/client");
          const { jobFailures } = await import("@/domains/db/schema/index");
          await getDb().insert(jobFailures).values({
            queue: q as string,
            payload: job.payload as Record<string, unknown>,
            error: String(e).slice(0, 500),
            attempts,
          });
        }
      }
    }
    if (!worked) await new Promise((r) => setTimeout(r, 1000));
  }
}
