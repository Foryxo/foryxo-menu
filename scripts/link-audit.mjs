#!/usr/bin/env node
/** Crawl public sitemap pages and their same-origin links against a local or staging server. */
const base = new URL(process.env.AUDIT_BASE_URL ?? "http://localhost:3000");
const timeoutMs = Number(process.env.AUDIT_TIMEOUT_MS ?? 30_000);
async function auditFetch(input, init = {}) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(input, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (![429, 502, 503, 504].includes(response.status) || attempt === 2) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
  }
  throw lastError;
}
const concurrency = Number(process.env.AUDIT_CONCURRENCY ?? 3);
const failures = [];

async function runPool(items, handler) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await handler(item);
    }
  }));
}

const sitemap = await auditFetch(new URL("/sitemap.xml", base));
if (!sitemap.ok) throw new Error(`sitemap.xml returned ${sitemap.status}`);
const xml = await sitemap.text();
const sources = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => new URL(match[1].replaceAll("&amp;", "&")))
  .map((url) => `${url.pathname}${url.search}`))];
const links = new Set();

await runPool(sources, async (path) => {
  try {
    const response = await auditFetch(new URL(path, base));
    if (!response.ok) {
      failures.push(`${path}: HTTP ${response.status}`);
      return;
    }
    const html = await response.text();
    if (!/<title>[^<]+<\/title>/.test(html)) failures.push(`${path}: missing title`);
    if (!/<meta name="description" content="[^"]+"/.test(html)) failures.push(`${path}: missing description`);
    const h1Count = [...html.matchAll(/<h1(?:\s|>)/g)].length;
    if (h1Count !== 1) failures.push(`${path}: expected one H1, found ${h1Count}`);
    for (const image of html.matchAll(/<img\b[^>]*>/g)) {
      if (!/\balt="[^"]*"/.test(image[0])) failures.push(`${path}: image without alt attribute`);
    }
    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
      const href = match[1].replaceAll("&amp;", "&");
      if (href.startsWith("#") || /^(?:mailto:|tel:|javascript:)/i.test(href)) continue;
      const target = new URL(href, new URL(path, base));
      if (target.origin !== base.origin && target.hostname !== "menu.foryxo.com") continue;
      if (target.pathname.startsWith("/_next/")) continue;
      links.add(`${target.pathname}${target.search}`);
    }
  } catch (error) {
    failures.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
});

await runPool([...links], async (path) => {
  try {
    const response = await auditFetch(new URL(path, base));
    if (!response.ok) failures.push(`internal link ${path}: HTTP ${response.status}`);
  } catch (error) {
    failures.push(`internal link ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
});

if (failures.length) {
  console.error(`Public link audit found ${failures.length} issue(s):`);
  for (const issue of failures) console.error(`  - ${issue}`);
  process.exitCode = 1;
} else {
  console.log(`Public link audit passed: ${sources.length} sitemap pages, ${links.size} unique internal links, title/description/H1/alt checks.`);
}
