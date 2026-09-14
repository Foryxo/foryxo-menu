import { and, count, eq, gte, inArray, isNull } from "drizzle-orm";
import { requireAdmin } from "@/domains/auth/guards";
import { isLocale } from "@/domains/i18n/config";
import { getDb } from "@/domains/db/client";
import {
  analyticsEvents,
  auditLogs,
  blogPosts,
  jobFailures,
  managedDemos,
  media,
  portfolioProjects,
  securityEvents,
  systemEvents,
  user,
  branches,
  orders,
} from "@/domains/db/schema/index";
import { Card, CardContent } from "@/components/ui/primitives";
function reportWindowStart() {
  return new Date(Date.now() - 30 * 86400000);
}
export default async function AdminReports({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  await requireAdmin();
  const db = getDb();
  const since = reportWindowStart();
  const values = await Promise.all([
    db.select({ c: count() }).from(user).where(gte(user.createdAt, since)),
    db
      .select({ c: count() })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since)),
    db
      .select({ c: count() })
      .from(securityEvents)
      .where(gte(securityEvents.createdAt, since)),
    db
      .select({ c: count() })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, since)),
    db
      .select({ c: count() })
      .from(jobFailures)
      .where(isNull(jobFailures.resolvedAt)),
    db
      .select({ c: count() })
      .from(systemEvents)
      .where(eq(systemEvents.severity, "error")),
    db
      .select({ c: count() })
      .from(media)
      .where(eq(media.scanStatus, "pending")),
    db
      .select({ c: count() })
      .from(portfolioProjects)
      .where(eq(portfolioProjects.status, "draft")),
    db
      .select({ c: count() })
      .from(blogPosts)
      .where(eq(blogPosts.status, "draft")),
    db
      .select({ c: count() })
      .from(managedDemos)
      .where(eq(managedDemos.status, "draft")),
    db.select({ c: count() }).from(branches),
    db.select({ c: count() }).from(branches).where(and(eq(branches.isActive, true), eq(branches.acceptsOrders, true))),
    db.select({ c: count() }).from(orders).where(gte(orders.createdAt, since)),
    db.select({ c: count() }).from(orders).where(inArray(orders.status, ["placed", "awaiting_confirmation", "accepted", "preparing", "ready"])),
    db.select({ c: count() }).from(orders).where(and(eq(orders.status, "rejected"), gte(orders.createdAt, since))),
  ]);
  const labels = [
    fa ? "ثبت‌نام ۳۰ روز" : "30-day signups",
    fa ? "رویداد تحلیلی ۳۰ روز" : "30-day analytics events",
    fa ? "رویداد امنیتی ۳۰ روز" : "30-day security events",
    fa ? "عملیات ثبت‌شده ۳۰ روز" : "30-day audited actions",
    fa ? "کار ناموفق حل‌نشده" : "Unresolved job failures",
    fa ? "خطاهای سیستم" : "System errors",
    fa ? "فایل منتظر بررسی" : "Media pending scan",
    fa ? "پروژه پیش‌نویس" : "Draft portfolio items",
    fa ? "مقاله پیش‌نویس" : "Draft articles",
    fa ? "دموی پیش‌نویس" : "Draft demos",
    fa ? "کل شعبه‌ها" : "Total branches",
    fa ? "شعبه سفارش‌پذیر" : "Order-enabled branches",
    fa ? "سفارش ۳۰ روز" : "30-day orders",
    fa ? "سفارش فعال" : "Active orders",
    fa ? "سفارش ردشده ۳۰ روز" : "30-day rejected orders",
  ];
  return (
    <div className="space-y-7">
      <div>
        <h1 className="display-3">
          {fa ? "گزارش جامع پلتفرم" : "Platform report"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {fa
            ? "کاربر، محتوا، امنیت، عملیات و سلامت سامانه."
            : "Users, content, security, operations, and system health."}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {values.map((v, i) => (
          <Card key={labels[i]}>
            <CardContent>
              <p className="text-xs text-muted">{labels[i]}</p>
              <p className="mt-2 text-2xl font-black">{v[0]?.c ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        <h2 className="font-extrabold">
          {fa ? "نکته اجرایی" : "Operational note"}
        </h2>
        <p className="mt-2 text-sm leading-7">
          {fa
            ? "این گزارش از داده‌های واقعی پایگاه داده ساخته می‌شود. معیارهای زیرساختی مانند زمان پاسخ، مصرف حافظه و نرخ خطا پس از اتصال سرویس مانیتورینگ و محیط تولید کامل می‌شوند."
            : "This report is built from real database records. Infrastructure metrics such as latency, memory use, and error rate become complete after production monitoring is connected."}
        </p>
      </section>
    </div>
  );
}
