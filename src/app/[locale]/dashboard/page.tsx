import Link from "next/link";
import { requireUser } from "@/domains/auth/guards";
import { getDashboardOverview } from "@/domains/dashboard/data";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { formatToman, formatDateTime } from "@/domains/i18n/format";
import { toPersianDigits } from "@/domains/i18n/normalize";
import { Card, CardContent, Badge, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function DashboardHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  const session = await requireUser(`/${l}/dashboard`);
  const data = await getDashboardOverview(session.user.id);
  const nd = (n: number | string) => (fa ? toPersianDigits(n) : String(n));

  if (!data) {
    return (
      <EmptyState
        title={t.dashboard.noProjects}
        action={
          <Link href={`/${l}/build`}>
            <Button>{t.dashboard.noProjectsCta}</Button>
          </Link>
        }
      />
    );
  }

  const { project, account, ledger, requests, unpaid, menu, notifications, history } = data;

  return (
    <div className="space-y-6">
      <h1 className="display-3">{t.dashboard.overview}</h1>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs text-muted">{t.dashboard.activeProject}</p>
            <p className="mt-1 font-extrabold">
              {project ? (fa ? "پروژه منو" : "Menu project") : "—"}
            </p>
            {project ? (
              <Badge className="mt-2">{t.dashboard.status[project.status as keyof typeof t.dashboard.status] ?? project.status}</Badge>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted">{t.dashboard.walletBalance}</p>
            <p className="mt-1 text-xl font-black accent-text">
              {account ? formatToman(account.balanceCached, l) : formatToman(0, l)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted">{t.dashboard.unpaidInvoice}</p>
            {unpaid ? (
              <>
                <p className="mt-1 font-extrabold">{formatToman(unpaid.total - unpaid.paidTotal, l)}</p>
                <Link href={`/${l}/dashboard/wallet`} className="mt-1 inline-block text-xs font-bold accent-text hover:underline">
                  {t.dashboard.payInvoice} →
                </Link>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">{fa ? "موردی نیست" : "Nothing due"}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted">{t.dashboard.openRequest}</p>
            <p className="mt-1 font-extrabold">{nd(requests.filter((r) => r.status !== "closed" && r.status !== "rejected").length)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending action */}
      {project?.status === "quoted" ? (
        <Card className="border-[var(--accent)]">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-extrabold">{t.dashboard.pendingAction}</p>
              <p className="text-sm text-muted">
                {fa ? "استعلام هزینه پروژه شما آماده بررسی است." : "Your project quote is ready for review."}
              </p>
            </div>
            <Link href={`/${l}/dashboard/projects`}>
              <Button size="sm">{t.dashboard.projects}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project timeline */}
        {project ? (
          <Card>
            <CardContent>
              <h2 className="mb-4 font-extrabold">{t.dashboard.projectTimeline}</h2>
              <ol className="space-y-0">
                {Object.values(t.dashboard.timeline).map((label, i) => {
                  const done = i < history.length;
                  const current = i === history.length;
                  return (
                    <li key={label} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`mt-1 size-3 rounded-full ${done ? "bg-emerald-500" : current ? "accent-bg ring-4 ring-[var(--accent-soft)]" : "bg-[var(--line)]"}`}
                          aria-hidden="true"
                        />
                        {i < Object.values(t.dashboard.timeline).length - 1 ? (
                          <span className={`w-px flex-1 ${done ? "bg-emerald-300" : "bg-[var(--line)]"}`} aria-hidden="true" />
                        ) : null}
                      </div>
                      <div className="pb-4">
                        <p className={`text-sm font-bold ${done || current ? "text-fg" : "text-muted"}`}>{label}</p>
                        {history[i] ? (
                          <p className="text-xs text-muted">{formatDateTime(history[i].createdAt, l)}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        ) : null}

        {/* Recent ledger + notifications */}
        <div className="space-y-6">
          <Card>
            <CardContent>
              <h2 className="mb-3 font-extrabold">{t.dashboard.transactions}</h2>
              {ledger.length === 0 ? (
                <p className="text-sm text-muted">{t.common.empty}</p>
              ) : (
                <ul className="divide-y divide-[var(--line)] text-sm">
                  {ledger.slice(0, 5).map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                      <span className="text-muted">
                        {t.dashboard.ledger[e.category as keyof typeof t.dashboard.ledger] ?? e.category}
                      </span>
                      <span className={`font-bold ${e.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {e.amount >= 0 ? "+" : "−"}{formatToman(Math.abs(e.amount), l)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h2 className="mb-3 font-extrabold">{t.dashboard.notificationsTitle}</h2>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted">{t.common.empty}</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {notifications.slice(0, 5).map((n) => (
                    <li key={n.id}>
                      <p className="font-bold">{fa ? n.titleFa : n.titleEn}</p>
                      {(fa ? n.bodyFa : n.bodyEn) ? <p className="text-xs text-muted">{fa ? n.bodyFa : n.bodyEn}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live menu link */}
      {menu?.status === "published" ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-extrabold">{t.dashboard.menus}</p>
              <p dir="ltr" className="text-sm accent-text">/menus/{menu.slug}/menu</p>
            </div>
            <a href={`/menus/${menu.slug}/menu`} target="_blank" rel="noopener">
              <Button variant="secondary" size="sm">{t.common.viewMenu}</Button>
            </a>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
