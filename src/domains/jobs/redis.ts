/**
 * Redis singleton. Optional: when REDIS_URL is not configured the app
 * degrades to in-memory behavior (dev only) without crashing.
 */
import { env, isProd } from "@/config/env";
import Redis, { type Redis as RedisClient } from "ioredis";

const g = globalThis as unknown as { foryxoRedis?: unknown };

export function getRedis(): RedisClient | null {
  if (!env.REDIS_URL) return null;
  if (g.foryxoRedis) return g.foryxoRedis as RedisClient;
  try {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
    });
    client.on("error", (e: Error) => console.error("[redis]", e.message));
    g.foryxoRedis = client;
    return client;
  } catch (e) {
    if (isProd) throw e;
    console.warn("[redis] unavailable, using in-memory fallback");
    return null;
  }
}
