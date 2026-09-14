import { requireAdmin } from "@/domains/auth/guards";
import { getAdminOverview } from "@/domains/admin/data";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { formatToman, formatDateTime } from "@/domains/i18n/format";
import { toPersianDigits } from "@/domains/i18n/normalize";
import { Card, CardContent, Badge } from "@/components/ui/primitives";
import Link from "next/link";

export default async function AdminOverview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  await requireAdmin(`/${l}/admin`, ["superadmin", "admin", "finance", "support", "editor"]);
  const data = await getAdminOverview();
  const nd = (n: number | string) => (fa ? toPersianDigits(n) : String(n));

  const kpis: { label: string; value: string; tone?: string }[] = [
    { label: t.admin.kpi.signups, value: nd(data.kpis.totalUsers), tone: fa ? `${nd(data.kpis.newSignups)} جدید` : `${nd(data.kpis.newSignups)} new` },
    { label: t.admin.kpi.activeClients, value: nd(data.kpis.activeClients) },
    { label: t.admin.kpi.publishedMenus, value: nd(data.kpis.publishedMenus) },
    { label: t.admin.kpi.pendingBuilds, value: nd(data.kpis.pendingBuilds) },
    { label: t.admin.kpi.openRequests, value: nd(data.kpis.openRequests) },
    { label: t.admin.kpi.revenue, value: formatToman(data.kpis.revenue, l) },
    { label: t.admin.kpi.refunds, value: formatToman(data.kpis.refunds, l) },
    { label: t.admin.kpi.walletLiability, value: formatToman(data.kpis.walletLiability, l) },
    { label: t.admin.kpi.failedPayments, value: nd(data.kpis.failedPayments) },
  ];

  return (
    <div className="space-y-8">
      <h1 className="display-3">{t.admin.overview}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent>
              <p className="text-xs text-muted">{k.label}</p>
              <p className="mt-1 text-xl font-black">{k.value}</p>
              {k.tone ? <p className="text-xs text-muted">{k.tone}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-extrabold">{t.admin.projects}</h2>
              <Link href={`/${l}/admin/projects`} className="text-xs font-bold accent-text hover:underline">
                {fa ? "همه" : "All"} →
              </Link>
            </div>
            <ul className="divide-y divide-[var(--line)] text-sm">
              {data.recentProjects.map(({ project, business }) => (
                <li key={project.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{business.name}</p>
                    <p className="text-xs text-muted">{formatDateTime(project.createdAt, l)}</p>
                  </div>
                  <Badge variant={project.status === "published" ? "success" : project.status === "cancelled" ? "danger" : "default"}>
                    {t.dashboard.status[project.status as keyof typeof t.dashboard.status] ?? project.status}
                  </Badge>
                </li>
              ))}
              {data.recentProjects.length === 0 ? <li className="py-3 text-muted">{t.common.empty}</li> : null}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-extrabold">{t.admin.payments}</h2>
              <Link href={`/${l}/admin/payments`} className="text-xs font-bold accent-text hover:underline">
                {fa ? "همه" : "All"} →
              </Link>
            </div>
            <ul className="divide-y divide-[var(--line)] text-sm">
              {data.recentPayments.map(({ payment, business }) => (
                <li key={payment.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{business.name}</p>
                    <p className="text-xs text-muted">{payment.provider} · {formatDateTime(payment.createdAt, l)}</p>
                  </div>
                  <span className={`font-bold ${payment.status === "paid" ? "text-emerald-600 dark:text-emerald-400" : payment.status === "failed" ? "text-red-600 dark:text-red-400" : "text-muted"}`}>
                    {formatToman(payment.amount, l)}
                  </span>
                </li>
              ))}
              {data.recentPayments.length === 0 ? <li className="py-3 text-muted">{t.common.empty}</li> : null}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
