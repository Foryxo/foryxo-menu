import Link from "next/link";
import { requireCreator } from "@/domains/auth/guards";
import { isLocale } from "@/domains/i18n/config";
import { formatToman, formatDateTime } from "@/domains/i18n/format";
import { getCreatorOverview } from "@/domains/creator/data";
import { Card, CardContent, Badge } from "@/components/ui/primitives";

export default async function CreatorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; const l = isLocale(locale) ? locale : "fa"; const fa = l === "fa";
  await requireCreator(); const data = await getCreatorOverview();
  const cards = [[fa ? "مشتریان" : "Clients", data.kpis.clients], [fa ? "پروژه فعال" : "Active projects", data.kpis.activeProjects], [fa ? "درخواست باز" : "Open requests", data.kpis.openRequests], [fa ? "فاکتور پرداخت‌نشده" : "Unpaid invoices", data.kpis.unpaidInvoices], [fa ? "منوی منتشرشده" : "Published menus", data.kpis.publishedMenus], [fa ? "درآمد ثبت‌شده" : "Recorded revenue", formatToman(data.kpis.revenue, l)]];
  return <div className="space-y-8"><div><p className="text-sm font-bold accent-text">{fa ? "مرکز کار خصوصی شما" : "Your private operating desk"}</p><h1 className="display-3 mt-1">{fa ? "سفارش‌ها، مشتریان و درآمد در یک نگاه" : "Orders, clients and revenue at a glance"}</h1></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value]) => <Card key={String(label)}><CardContent><p className="text-xs text-muted">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></CardContent></Card>)}</div><Card><CardContent><div className="flex items-center justify-between"><h2 className="font-extrabold">{fa ? "آخرین درخواست‌ها" : "Latest requests"}</h2><Link href={`/${l}/creator/inbox`} className="text-sm font-bold accent-text hover:underline">{fa ? "بازکردن گفت‌وگوها" : "Open inbox"}</Link></div><div className="mt-4 divide-y divide-[var(--line)]">{data.recentRequests.map(({ request, business }) => <Link key={request.id} href={`/${l}/creator/inbox?request=${request.id}`} className="flex items-center justify-between gap-4 py-3 hover:text-[var(--accent)]"><div><p className="font-bold">{request.title}</p><p className="text-xs text-muted">{business.name} · {formatDateTime(request.updatedAt, l)}</p></div><Badge variant={request.urgency === "urgent" ? "danger" : "default"}>{request.status}</Badge></Link>)}{data.recentRequests.length === 0 ? <p className="py-5 text-sm text-muted">{fa ? "هنوز درخواستی ثبت نشده است." : "No service requests yet."}</p> : null}</div></CardContent></Card></div>;
}
