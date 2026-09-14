/**
 * Standalone job worker (production: `npm run jobs:drain` under PM2/systemd).
 * Drains all queues by calling the same processJob used by the dev worker.
 */
async function main() {
  const { getRedis } = await import("../src/domains/jobs/redis");
  const redis = getRedis();

  if (!redis) {
    console.log("No REDIS_URL — dev mode: in-memory queue worker is driven by the web app process. Nothing to drain.");
    process.exit(0);
  }

  const { drainAll } = await import("../src/domains/jobs/worker");
  console.log("→ jobs worker started (redis mode), draining all queues…");
  await drainAll();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
