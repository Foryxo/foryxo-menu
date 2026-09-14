import { requireCreator } from "@/domains/auth/guards";
import { isLocale } from "@/domains/i18n/config";
import { formatToman } from "@/domains/i18n/format";
import { getCreatorOverview } from "@/domains/creator/data";
import { Card, CardContent } from "@/components/ui/primitives";

export default async function CreatorReports({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  await requireCreator();
  const data = await getCreatorOverview();
  const metrics = [
    [fa ? "کل مشتریان" : "Total clients", data.kpis.clients],
    [fa ? "پروژه‌های در جریان" : "Projects in flight", data.kpis.activeProjects],
    [fa ? "درخواست‌های نیازمند پاسخ" : "Requests needing attention", data.kpis.openRequests],
    [fa ? "فاکتورهای باز" : "Open invoices", data.kpis.unpaidInvoices],
    [fa ? "منوهای منتشرشده" : "Published menus", data.kpis.publishedMenus],
    [fa ? "اسکن QR" : "QR scans", data.kpis.qrScans],
    [fa ? "پروژه‌های عمومی" : "Public portfolio", data.kpis.publishedWork],
    [fa ? "مقاله‌های منتشرشده" : "Published articles", data.kpis.publishedPosts],
    [fa ? "دموهای مدیریتی" : "Managed demos", data.kpis.managedDemos],
    [fa ? "درآمد ناخالص ثبت‌شده" : "Recorded gross revenue", formatToman(data.kpis.revenue, l)],
  ];
  return (
    <div className="space-y-7">
      <div>
        <h1 className="display-3">{fa ? "گزارش استودیو" : "Studio report"}</h1>
        <p className="mt-1 text-sm text-muted">{fa ? "نمای عملیاتی از فروش، تحویل، محتوا، QR و پشتیبانی." : "An operating view of sales, delivery, content, QR, and support."}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([label, value]) => <Card key={String(label)}><CardContent><p className="text-xs text-muted">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></CardContent></Card>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          [fa ? "فروش" : "Sales", fa ? "درخواست‌های باز را قیمت‌گذاری کنید و فاکتورهای باز را پیگیری کنید." : "Quote open requests and follow up on unpaid invoices."],
          [fa ? "تحویل" : "Delivery", fa ? "پروژه‌های در جریان و دورهای اصلاح را هر روز مرور کنید." : "Review in-flight projects and revision rounds daily."],
          [fa ? "QR و محتوا" : "QR & content", fa ? "کدهای میز را تحویل دهید و پروژه‌ها و مقاله‌ها را پس از بازبینی منتشر کنید." : "Deliver table codes and publish projects and articles after review."],
        ].map(([title, body]) => <section key={title} className="surface rounded-2xl p-5"><h2 className="font-extrabold">{title}</h2><p className="mt-2 text-sm leading-7 text-muted">{body}</p></section>)}
      </div>
    </div>
  );
}
