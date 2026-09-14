import { requireAdmin } from "@/domains/auth/guards";
import { getAdminProjects } from "@/domains/admin/data";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { formatToman } from "@/domains/i18n/format";
import { Badge } from "@/components/ui/primitives";

const STAGES = ["submitted", "quoted", "approved", "in_build", "review", "revision", "approved_final", "published"] as const;

export default async function AdminProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  await requireAdmin(`/${l}/admin/projects`, ["superadmin", "admin", "support"]);
  const rows = await getAdminProjects();

  return (
    <div className="space-y-6">
      <h1 className="display-3">{t.admin.projects}</h1>
      <div className="grid gap-4 overflow-x-auto lg:grid-flow-col lg:auto-cols-max">
        {STAGES.map((stage) => {
          const items = rows.filter((r) => r.project.status === stage);
          if (items.length === 0 && stage !== "submitted") return null;
          return (
            <div key={stage} className="min-w-56">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-sm font-extrabold">
                  {t.dashboard.status[stage as keyof typeof t.dashboard.status] ?? stage}
                </h2>
                <Badge variant="neutral">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map(({ project, business }) => {
                  const cfg = project.configuration as { estimateAtSubmission?: { initialTotal: number }; demoId?: string };
                  return (
                    <div key={project.id} className="surface rounded-xl p-3 text-sm">
                      <p className="font-bold">{business.name}</p>
                      <p className="text-xs text-muted">{cfg.demoId ?? "—"} · {fa ? project.demoId : ""}</p>
                      {cfg.estimateAtSubmission ? (
                        <p className="mt-1 text-xs font-bold accent-text">
                          {formatToman(cfg.estimateAtSubmission.initialTotal, l)}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line p-3 text-xs text-muted">{t.common.empty}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
