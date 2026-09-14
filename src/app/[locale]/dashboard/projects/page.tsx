import { requireUser } from "@/domains/auth/guards";
import { getDashboardOverview } from "@/domains/dashboard/data";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { formatToman, formatDateTime } from "@/domains/i18n/format";
import { toPersianDigits } from "@/domains/i18n/normalize";
import { Card, CardContent, Badge, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  const session = await requireUser(`/${l}/dashboard/projects`);
  const data = await getDashboardOverview(session.user.id);

  if (!data?.project) {
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

  const { project, history } = data;
  const config = project.configuration as {
    demoId?: string;
    languages?: string[];
    features?: string[];
    management?: string;
    domainOption?: string;
    contentOption?: string;
    estimateAtSubmission?: { initialTotal: number; recurringAnnual: number };
  };
  const nd = (n: number | string) => (fa ? toPersianDigits(n) : String(n));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-3">{t.dashboard.projects}</h1>
        <Badge>{t.dashboard.status[project.status as keyof typeof t.dashboard.status] ?? project.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 font-extrabold">{t.dashboard.projectTimeline}</h2>
            <ol>
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
                      {history[i] ? <p className="text-xs text-muted">{formatDateTime(history[i].createdAt, l)}</p> : null}
                      {history[i]?.note ? <p className="text-xs text-muted">{history[i].note}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent>
              <h2 className="mb-4 font-extrabold">{t.build.summary}</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t.build.steps.demo}</dt>
                  <dd className="font-bold">{config.demoId ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t.build.steps.language}</dt>
                  <dd className="font-bold">{nd(config.languages?.length ?? 0)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t.build.steps.features}</dt>
                  <dd className="font-bold">{nd(config.features?.length ?? 0)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t.build.steps.management}</dt>
                  <dd className="font-bold">{config.management ? t.build.managementOptions[config.management as keyof typeof t.build.managementOptions] : "—"}</dd>
                </div>
                {config.estimateAtSubmission ? (
                  <>
                    <div className="mt-3 flex justify-between gap-2 border-t border-line pt-3">
                      <dt className="font-bold">{t.build.estimateInitial}</dt>
                      <dd className="font-black accent-text">{formatToman(config.estimateAtSubmission.initialTotal, l)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">{t.build.estimateRecurring}</dt>
                      <dd className="font-bold">{formatToman(config.estimateAtSubmission.recurringAnnual, l)}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="mb-3 font-extrabold">{t.dashboard.files}</h2>
              {data.files.length === 0 ? (
                <p className="text-sm text-muted">{t.dashboard.filesEmpty}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.files.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold">{f.filename}</span>
                      <span className="text-xs text-muted">{nd(Math.round(f.size / 1024))} KB</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
