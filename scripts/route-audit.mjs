#!/usr/bin/env node

const base = (process.env.AUDIT_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
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
// Production concurrency belongs to the PostgreSQL-backed k6 load test; this
// sweep is deliberately serial so it validates the rendered content itself.
const concurrency = 1;
let nextIndex = 0;

async function worker() {
  while (nextIndex < paths.length) {
    const path = paths[nextIndex++];
    try {
      const response = await fetch(`${base}${path}`, { redirect: "follow" });
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
  const notFoundResponse = await fetch(`${base}/fa/__route-audit-not-found__`, { redirect: "manual" });
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
