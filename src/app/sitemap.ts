import type { MetadataRoute } from "next";
import { SITE_URL } from "@/domains/seo/hreflang";
import { getDb } from "@/domains/db/client";
import { menus, blogPosts } from "@/domains/db/schema/index";
import { eq, and } from "drizzle-orm";
import { blogArticles } from "@content/blog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticLastModified = new Date("2026-09-10T00:00:00.000Z");
  const staticPaths = [
    "", "/demos", "/pricing", "/features", "/how-it-works", "/faq",
    "/about", "/contact", "/blog", "/security", "/privacy", "/terms",
    "/refund-policy", "/projects",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const p of staticPaths) {
    for (const locale of ["fa", "en"]) {
      entries.push({
        url: `${SITE_URL}/${locale}${p || ""}`,
        lastModified: staticLastModified,
        changeFrequency: p === "" ? "daily" : "weekly",
        priority: p === "" ? 1 : 0.7,
        alternates: {
          languages: {
            fa: `${SITE_URL}/fa${p || ""}`,
            en: `${SITE_URL}/en${p || ""}`,
          },
        },
      });
    }
  }

  for (const article of blogArticles) {
    for (const locale of ["fa", "en"] as const) {
      entries.push({
        url: `${SITE_URL}/${locale}/blog/${article.slug}`,
        lastModified: new Date(article.updatedAt),
        changeFrequency: "monthly",
        priority: 0.65,
        alternates: {
          languages: {
            fa: `${SITE_URL}/fa/blog/${article.slug}`,
            en: `${SITE_URL}/en/blog/${article.slug}`,
          },
        },
      });
    }
  }

  // Indexable published menus
  try {
    const db = getDb();
    const publicMenus = await db
      .select({ slug: menus.slug, updatedAt: menus.updatedAt })
      .from(menus)
      .where(and(eq(menus.status, "published"), eq(menus.indexable, true)));
    for (const m of publicMenus) {
      entries.push({
        url: `${SITE_URL}/menus/${m.slug}/menu`,
        lastModified: m.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    const posts = await db
      .select({ locale: blogPosts.locale, slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"));
    for (const p of posts) {
      entries.push({
        url: `${SITE_URL}/${p.locale}/blog/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // Sitemap must not fail if DB is unreachable at build time.
  }

  return entries;
}
