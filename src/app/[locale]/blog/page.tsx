import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { blogArticles } from "@content/blog";
import { isLocale } from "@/domains/i18n/config";
import { alternatesFor } from "@/domains/seo/hreflang";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import { blogPosts } from "@/domains/db/schema/index";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  return {
    title: l === "fa" ? "وبلاگ منوی دیجیتال" : "Digital menu journal",
    description: l === "fa" ? "راهنمای کاربردی طراحی، عکاسی و مدیریت منوی دیجیتال." : "Practical guidance on designing, photographing, and operating digital menus.",
    alternates: alternatesFor(l, "/blog"),
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  let managed: typeof blogPosts.$inferSelect[] = [];
  try {
    managed = await getDb().select().from(blogPosts).where(and(eq(blogPosts.status, "published"), eq(blogPosts.locale, l))).orderBy(desc(blogPosts.publishedAt));
  } catch {
    // Static journal remains available before database migrations.
  }
  return (
    <PageShell locale={l}>
      <section className="mx-auto max-w-6xl px-4 pb-24 pt-12">
        <p className="text-sm font-bold accent-text">{fa ? "یادداشت‌های فوریکسو" : "The Foryxo journal"}</p>
        <h1 className="display-1 mt-2">{fa ? "منوی بهتر، تجربه بهتر" : "Better menus, better experiences"}</h1>
        <p className="lede mt-4 max-w-2xl">{fa ? "نکته‌های کاربردی برای ساخت منوی سریع، زیبا و قابل استفاده." : "Practical notes for building menus that are fast, beautiful, and genuinely usable."}</p>
        <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {blogArticles.map((article, index) => (
            <article key={article.slug} className="group overflow-hidden rounded-3xl border border-line bg-elevated shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]">
              <Link href={`/${l}/blog/${article.slug}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={article.image} alt={article.title[l]} fill priority={index === 0} sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold accent-text">{article.category[l]}</p>
                  <h2 className="mt-2 text-xl font-extrabold leading-snug">{article.title[l]}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted">{article.excerpt[l]}</p>
                  <p className="mt-5 text-xs font-semibold text-muted">{article.readingMinutes} {fa ? "دقیقه مطالعه" : "min read"}</p>
                </div>
              </Link>
            </article>
          ))}
          {managed.filter((post) => !blogArticles.some((article) => article.slug === post.slug)).map((post) => (
            <article key={post.id} className="interactive-lift group overflow-hidden rounded-3xl border border-line bg-elevated shadow-[var(--shadow-card)]">
              <Link href={`/${l}/blog/${post.slug}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-subtle">
                  <Image src={post.heroMediaId || "/logo.png"} alt={post.title} fill unoptimized={Boolean(post.heroMediaId?.startsWith("http"))} sizes="(max-width: 768px) 100vw, 33vw" className={post.heroMediaId ? "object-cover transition-transform duration-500 group-hover:scale-105" : "object-contain p-12"} />
                </div>
                <div className="p-5"><p className="text-xs font-bold accent-text">{post.category || (fa ? "فوریکسو" : "Foryxo")}</p><h2 className="mt-2 text-xl font-extrabold leading-snug">{post.title}</h2><p className="mt-3 text-sm leading-6 text-muted">{post.excerpt}</p></div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
