#!/usr/bin/env node

const base = (process.env.AUDIT_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
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
const localized = [
  "", "about", "blog", "build", "contact", "demos", "faq", "features",
  "how-it-works", "login", "pricing", "privacy", "refund-policy", "register",
  "security", "terms", "projects", "status/payment-success", "status/payment-failed",
  "status/payment-cancelled", "status/rate-limited",
];
const demos = ["atria", "crush", "district", "form", "khesht", "miette", "mora", "noir", "sunday", "volt"];
const articles = [
  "digital-menu-that-people-can-actually-use",
  "food-photography-for-online-menus",
  "bilingual-persian-english-menu",
];

const paths = [
  ...["fa", "en"].flatMap((locale) => [
    ...localized.map((path) => `/${locale}${path ? `/${path}` : ""}`),
    ...demos.map((slug) => `/${locale}/demos/${slug}`),
    ...articles.map((slug) => `/${locale}/blog/${slug}`),
  ]),
  ...demos.flatMap((slug) => [`/menus/${slug}/menu?lang=fa`, `/menus/${slug}/menu?lang=en`]),
  "/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/favicon.ico", "/icon.png", "/llms.txt",
];

const failures = [];
// The checked-in local database is a single-process embedded PGlite instance.
// Remote deployments use PostgreSQL and can be checked concurrently.
const isLocal = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::|\/|$)/.test(base);
const concurrency = isLocal ? 1 : Number(process.env.AUDIT_CONCURRENCY ?? 3);
let nextIndex = 0;

async function worker() {
  while (nextIndex < paths.length) {
    const path = paths[nextIndex++];
    try {
      const response = await auditFetch(`${base}${path}`, { redirect: "follow" });
      if (!response.ok) failures.push(`${path} -> ${response.status}`);
      const contentType = response.headers.get("content-type") ?? "";
      if (response.ok && contentType.includes("text/html")) {
        const body = await response.text();
        if (/data-runtime-error=["']true["']|Application error|Internal Server Error/i.test(body)) {
          failures.push(`${path} -> rendered an error boundary`);
        }
      }
    } catch (error) {
      failures.push(`${path} -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

try {
  const notFoundResponse = await auditFetch(`${base}/fa/__route-audit-not-found__`, { redirect: "manual" });
  if (notFoundResponse.status !== 404) failures.push(`/fa/__route-audit-not-found__ -> expected 404, got ${notFoundResponse.status}`);
} catch (error) {
  failures.push(`/fa/__route-audit-not-found__ -> ${error instanceof Error ? error.message : String(error)}`);
}

if (failures.length) {
  console.error("Route audit failed:");
  failures.sort().forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(`Route audit passed: ${paths.length} public URLs plus the custom 404 returned successfully.`);
