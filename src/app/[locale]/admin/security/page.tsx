import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/domains/auth/guards";
import { getDb } from "@/domains/db/client";
import { securityEvents, auditLogs, payments, jobFailures } from "@/domains/db/schema/index";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { formatDateTime, formatToman } from "@/domains/i18n/format";
import { toPersianDigits } from "@/domains/i18n/normalize";
import { Card, CardContent } from "@/components/ui/primitives";
import { queueHealth } from "@/domains/jobs/queues";

export default async function AdminSecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  await requireAdmin(`/${l}/admin/security`, ["superadmin", "admin"]);
  const db = getDb();
  const nd = (n: number | string) => (fa ? toPersianDigits(n) : String(n));

  const [events, auditRows, failedPayments, jobFails, queue] = await Promise.all([
    db.select().from(securityEvents).orderBy(desc(securityEvents.createdAt)).limit(30),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(30),
    db.select().from(payments).where(eq(payments.status, "failed")).orderBy(desc(payments.createdAt)).limit(10),
    db.select().from(jobFailures).orderBy(desc(jobFailures.createdAt)).limit(10),
    queueHealth(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="display-3">{t.admin.security}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-xs text-muted">{fa ? "حالت صف" : "Queue mode"}</p>
            <p className="mt-1 font-extrabold">{queue.mode}</p>
            <p className="text-xs text-muted">{fa ? "در انتظار" : "pending"}: {nd(queue.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted">{fa ? "پرداخت ناموفق" : "Failed payments"}</p>
            <p className="mt-1 font-extrabold">{nd(failedPayments.length)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted">{fa ? "خطاهای صف" : "Job failures"}</p>
            <p className="mt-1 font-extrabold">{nd(jobFails.length)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <h2 className="mb-3 font-extrabold">{fa ? "رویدادهای امنیتی" : "Security events"}</h2>
          <ul className="divide-y divide-[var(--line)] text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                <span className="font-mono text-xs" dir="ltr">{e.type}</span>
                <span className="text-xs text-muted">{e.ip ?? "—"} · {formatDateTime(e.createdAt, l)}</span>
              </li>
            ))}
            {events.length === 0 ? <li className="py-2 text-muted">{t.common.empty}</li> : null}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="mb-3 font-extrabold">{t.admin.auditLog}</h2>
          <ul className="divide-y divide-[var(--line)] text-sm">
            {auditRows.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-mono text-xs font-bold" dir="ltr">{a.action}</span>
                <span className="text-xs text-muted">
                  {a.targetType} · {formatDateTime(a.createdAt, l)}
                  {a.actorUserId ? ` · ${a.actorUserId.slice(0, 8)}…` : ""}
                </span>
              </li>
            ))}
            {auditRows.length === 0 ? <li className="py-2 text-muted">{t.common.empty}</li> : null}
          </ul>
        </CardContent>
      </Card>

      {failedPayments.length > 0 ? (
        <Card>
          <CardContent>
            <h2 className="mb-3 font-extrabold">{t.admin.kpi.failedPayments}</h2>
            <ul className="space-y-2 text-sm">
              {failedPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs" dir="ltr">{p.provider} · {p.failureReason ?? "—"}</span>
                  <span className="font-bold">{formatToman(p.amount, l)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
