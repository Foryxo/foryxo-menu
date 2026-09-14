import { desc, eq, and } from "drizzle-orm";
import { requireUser } from "@/domains/auth/guards";
import { getDb } from "@/domains/db/client";
import { session, securityEvents } from "@/domains/db/schema/index";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { formatDateTime } from "@/domains/i18n/format";
import { Card, CardContent } from "@/components/ui/primitives";
import { RevokeSessionButton } from "./revoke-session-button";

export default async function DashboardSecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  const s = await requireUser(`/${l}/dashboard/security`);
  const db = getDb();

  const sessions = await db
    .select()
    .from(session)
    .where(and(eq(session.userId, s.user.id)))
    .orderBy(desc(session.createdAt))
    .limit(10);

  const events = await db
    .select()
    .from(securityEvents)
    .where(eq(securityEvents.userId, s.user.id))
    .orderBy(desc(securityEvents.createdAt))
    .limit(15);

  return (
    <div className="space-y-6">
      <h1 className="display-3">{t.dashboard.security}</h1>

      <Card>
        <CardContent>
          <h2 className="mb-3 font-extrabold">{t.dashboard.sessions}</h2>
          <ul className="divide-y divide-[var(--line)] text-sm">
            {sessions.map((ses) => (
              <li key={ses.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{ses.userAgent?.slice(0, 60) ?? (fa ? "دستگاه ناشناس" : "Unknown device")}</p>
                  <p className="text-xs text-muted">
                    {ses.ipAddress ?? "—"} · {formatDateTime(ses.createdAt, l)}
                    {ses.revokedAt ? ` · ${fa ? "لغوشده" : "revoked"}` : ""}
                  </p>
                </div>
                {!ses.revokedAt ? (
                  <RevokeSessionButton sessionId={ses.id} label={t.dashboard.revokeSession} />
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="mb-3 font-extrabold">{t.dashboard.securityEvents}</h2>
          {events.length === 0 ? (
            <p className="text-sm text-muted">{t.common.empty}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex justify-between gap-2">
                  <span className="font-mono text-xs" dir="ltr">{e.type}</span>
                  <span className="text-xs text-muted">{formatDateTime(e.createdAt, l)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
