import { desc } from "drizzle-orm";
import { requireAdmin } from "@/domains/auth/guards";
import { isLocale } from "@/domains/i18n/config";
import { getDb } from "@/domains/db/client";
import {
  blogPosts,
  managedDemos,
  portfolioProjects,
} from "@/domains/db/schema/index";
import { Badge, Card, CardContent } from "@/components/ui/primitives";
import { ContentManager, StatusButton } from "./content-manager";
export default async function ContentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  await requireAdmin(`/${l}/admin/content`, ["superadmin", "admin", "editor"]);
  const db = getDb();
  const [work, demos, posts] = await Promise.all([
    db
      .select()
      .from(portfolioProjects)
      .orderBy(desc(portfolioProjects.updatedAt))
      .limit(50),
    db
      .select()
      .from(managedDemos)
      .orderBy(desc(managedDemos.updatedAt))
      .limit(50),
    db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt)).limit(50),
  ]);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="display-3">{fa ? "مرکز محتوا" : "Content studio"}</h1>
        <p className="mt-1 text-sm text-muted">
          {fa
            ? "دمو، پروژه انجام‌شده و نوشته وبلاگ را بارگذاری و منتشر کنید."
            : "Upload and publish demos, completed work, and blog posts."}
        </p>
      </div>
      <ContentManager locale={l} />
      <div className="grid gap-5 xl:grid-cols-3">
        {(
          [
            ["portfolio", fa ? "پروژه‌ها" : "Portfolio", work],
            ["demo", fa ? "دموهای افزوده" : "Managed demos", demos],
            ["blog", fa ? "وبلاگ" : "Blog", posts],
          ] as const
        ).map(([entity, title, rows]) => (
          <Card key={entity}>
            <CardContent>
              <h2 className="font-extrabold">{title}</h2>
              <div className="mt-3 divide-y divide-[var(--line)]">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-2 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {"title" in row ? row.title : row.titleEn}
                      </p>
                      <Badge
                        variant={
                          row.status === "published" ? "success" : "neutral"
                        }
                      >
                        {row.status}
                      </Badge>
                    </div>
                    <StatusButton
                      entity={entity}
                      id={row.id}
                      status={row.status}
                      locale={l}
                    />
                  </div>
                ))}
                {!rows.length ? (
                  <p className="py-3 text-sm text-muted">
                    {fa ? "هنوز چیزی اضافه نشده است." : "Nothing added yet."}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
