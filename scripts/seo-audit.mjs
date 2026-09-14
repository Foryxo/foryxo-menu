#!/usr/bin/env node
/**
 * Foryxo Menu — SEO audit script.
 * Validates structural invariants that would break search crawling:
 * locale-prefixed public routes, metadata exports, robots, sitemap,
 * llms.txt (AEO), hreflang + JSON-LD helpers, live menu SEO.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const errors = [];
const warnings = [];

function must(cond, msg) {
  if (!cond) errors.push(msg);
}
function should(cond, msg) {
  if (!cond) warnings.push(msg);
}

// 1. robots + sitemap exist
must(existsSync(resolve(root, "src/app/robots.ts")), "robots.ts missing (src/app/robots.ts)");
must(existsSync(resolve(root, "src/app/sitemap.ts")), "sitemap.ts missing (src/app/sitemap.ts)");

// 2. llms.txt route exists (AEO)
must(
  existsSync(resolve(root, "src/app/llms.txt/route.ts")),
  "llms.txt route missing (src/app/llms.txt/route.ts) — recommended AEO surface",
);

// 3. Locale-prefixed public routes with metadata
const LOCALE_DIR = resolve(root, "src/app/[locale]");
const PUBLIC_ROUTES = [
  "page",
  "demos/page",
  "pricing/page",
  "features/page",
  "how-it-works/page",
  "faq/page",
  "about/page",
  "contact/page",
  "security/page",
  "privacy/page",
  "terms/page",
  "refund-policy/page",
  "blog/page",
  "blog/[slug]/page",
];

for (const route of PUBLIC_ROUTES) {
  const p = resolve(LOCALE_DIR, `${route}.tsx`);
  must(existsSync(p), `public route missing: src/app/[locale]/${route}.tsx`);
  if (existsSync(p)) {
    const src = readFileSync(p, "utf8");
    should(
      src.includes("export const metadata") || src.includes("generateMetadata"),
      `no metadata export in src/app/[locale]/${route}.tsx`,
    );
    must(
      !src.includes("robots: { index: false") && !/noindex/.test(src),
      `accidental noindex in src/app/[locale]/${route}.tsx`,
    );
  }
}

// 4. Live menu route exists with metadata + JSON-LD
const menuPage = resolve(root, "src/app/menus/[slug]/menu/page.tsx");
must(existsSync(menuPage), "live menu page missing: src/app/menus/[slug]/menu/page.tsx");
if (existsSync(menuPage)) {
  const src = readFileSync(menuPage, "utf8");
  should(src.includes("generateMetadata"), "live menu page lacks generateMetadata");
  should(src.includes("application/ld+json"), "live menu page lacks JSON-LD structured data");
}

// 5. SEO domain helpers
const hreflang = resolve(root, "src/domains/seo/hreflang.ts");
must(existsSync(hreflang), "hreflang helper missing (src/domains/seo/hreflang.ts)");
must(existsSync(resolve(root, "src/domains/seo/jsonld.ts")), "JSON-LD builders missing");
must(existsSync(resolve(root, "src/domains/seo/indexnow.ts")), "IndexNow helper missing");

// 6. Demo content exists (portfolio surface)
const demosDir = resolve(root, "content/demos");
must(existsSync(demosDir) && statSync(demosDir).isDirectory(), "content/demos missing");
if (existsSync(demosDir)) {
  const demoFiles = readdirSync(demosDir).filter((f) => f.endsWith(".ts") && f !== "types.ts" && f !== "index.ts");
  must(demoFiles.length >= 10, `expected 10 demo definitions, found ${demoFiles.length}`);
}

// 7. Sitemap references menus
const sitemapSrc = existsSync(resolve(root, "src/app/sitemap.ts"))
  ? readFileSync(resolve(root, "src/app/sitemap.ts"), "utf8")
  : "";
should(/menus/.test(sitemapSrc), "sitemap does not appear to include /menus/* routes");

if (errors.length) {
  console.error("✗ SEO audit failed:");
  for (const e of errors) console.error("  -", e);
  process.exit(1);
}
if (warnings.length) {
  console.warn("⚠ SEO audit warnings:");
  for (const w of warnings) console.warn("  -", w);
}
console.log("✓ SEO audit passed");
