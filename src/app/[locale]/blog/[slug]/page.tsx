import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { blogArticles, getBlogArticle } from "@content/blog";
import { isLocale } from "@/domains/i18n/config";
import { alternatesFor } from "@/domains/seo/hreflang";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import { blogPosts } from "@/domains/db/schema/index";

export function generateStaticParams() {
  return blogArticles.flatMap((article) => ["fa", "en"].map((locale) => ({ locale, slug: article.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const article = getBlogArticle(slug);
  if (!article) {
    try {
      const [post] = await getDb().select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.locale, l), eq(blogPosts.status, "published"))).limit(1);
      if (post) return { title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt || undefined, alternates: alternatesFor(l, `/blog/${slug}`), openGraph: { title: post.title, description: post.excerpt || undefined, type: "article", images: post.heroMediaId ? [post.heroMediaId] : ["/logo.png"] } };
    } catch {}
    return {};
  }
  return {
    title: article.title[l],
    description: article.excerpt[l],
    alternates: alternatesFor(l, `/blog/${slug}`),
    openGraph: { title: article.title[l], description: article.excerpt[l], type: "article", images: [article.image] },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const article = getBlogArticle(slug);
  if (!article) {
    let post: typeof blogPosts.$inferSelect | undefined;
    try { [post] = await getDb().select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.locale, l), eq(blogPosts.status, "published"))).limit(1); } catch {}
    if (!post) notFound();
    const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.excerpt, image: post.heroMediaId || "/logo.png", datePublished: post.publishedAt?.toISOString(), dateModified: post.updatedAt.toISOString(), author: { "@type": "Organization", name: "Foryxo Menu" } };
    return <PageShell locale={l}><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/><article className="mx-auto max-w-3xl px-4 pb-24 pt-10"><nav aria-label={fa?"مسیر صفحه":"Breadcrumb"} className="text-sm text-muted"><Link href={`/${l}/blog`} className="hover:text-fg">{fa?"وبلاگ":"Journal"}</Link><span aria-hidden="true"> / </span><span>{post.category||"Foryxo"}</span></nav><p className="mt-10 text-sm font-bold accent-text">{post.category||"Foryxo"}</p><h1 className="display-1 mt-3">{post.title}</h1>{post.excerpt?<p className="lede mt-5">{post.excerpt}</p>:null}{post.heroMediaId?<div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-3xl"><Image src={post.heroMediaId} alt={post.title} fill priority unoptimized={post.heroMediaId.startsWith("http")} sizes="(max-width:768px) 100vw, 768px" className="object-cover"/></div>:null}<div className="mt-12 space-y-5 text-base leading-8 text-muted">{post.content.split(/\n\s*\n/).filter(Boolean).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div></article></PageShell>;
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title[l],
    description: article.excerpt[l],
    image: article.image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: "Foryxo Menu" },
  };
  return (
    <PageShell locale={l}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-4 pb-24 pt-10">
        <nav aria-label={fa ? "مسیر صفحه" : "Breadcrumb"} className="text-sm text-muted">
          <Link href={`/${l}/blog`} className="hover:text-fg">{fa ? "وبلاگ" : "Journal"}</Link>
          <span aria-hidden="true"> / </span>
          <span>{article.category[l]}</span>
        </nav>
        <p className="mt-10 text-sm font-bold accent-text">{article.category[l]}</p>
        <h1 className="display-1 mt-3">{article.title[l]}</h1>
        <p className="lede mt-5">{article.excerpt[l]}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted">
          <time dateTime={article.updatedAt}>{fa ? "به‌روزرسانی" : "Updated"}: {article.updatedAt}</time>
          <span aria-hidden="true">·</span>
          <span>{article.readingMinutes} {fa ? "دقیقه مطالعه" : "min read"}</span>
        </div>
        <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-3xl">
          <Image src={article.image} alt={article.title[l]} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
        <div className="mt-12 space-y-10">
          {article.sections[l].map((section) => (
            <section key={section.heading}>
              <h2 className="display-3">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-base leading-8 text-muted">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-14 rounded-3xl bg-[var(--accent-soft)] p-7">
          <h2 className="text-xl font-extrabold">{fa ? "منوی خودتان را شروع کنید" : "Start your own menu"}</h2>
          <p className="mt-2 text-sm text-muted">{fa ? "دموهای کامل را ببینید یا مسیر طراحی اختصاصی را انتخاب کنید." : "Explore the full demos or choose a completely custom direction."}</p>
          <Link href={`/${l}/build`} className="mt-5 inline-flex h-11 items-center rounded-xl accent-bg px-5 text-sm font-bold">{fa ? "ساخت منو" : "Build my menu"}</Link>
        </div>
      </article>
    </PageShell>
  );
}
