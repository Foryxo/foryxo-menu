import { FileText, ImageIcon } from "lucide-react";
import { requireCreator } from "@/domains/auth/guards";
import { isLocale } from "@/domains/i18n/config";
import { formatDateTime, formatToman } from "@/domains/i18n/format";
import { getCreatorProjects } from "@/domains/creator/data";
import { makeImplementationBrief } from "@/domains/builder/brief";
import { Badge, Card, CardContent } from "@/components/ui/primitives";
import { CopyBuildBrief } from "@/components/creator/copy-build-brief";
import { getStorage } from "@/domains/storage/index";
import { env } from "@/config/env";

export default async function CreatorProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  await requireCreator();
  const { rows, files } = await getCreatorProjects();
  const storage = getStorage();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold accent-text">{fa ? "مشخصات تحویلی بدون حذف" : "Lossless customer handoff"}</p>
        <h1 className="display-3 mt-1">{fa ? "سفارش‌ها و بریف ساخت" : "Build orders & implementation briefs"}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{fa ? "تمام انتخاب‌های ثبت‌شده، قیمت همان لحظه و فایل‌های مشتری اینجا یک‌جا نگهداری می‌شوند. خروجی JSON را می‌توان مستقیماً برای ساخت منو استفاده کرد." : "Every submitted choice, submission-time estimate, and customer asset is kept together here. The JSON handoff is ready to use when implementing the menu."}</p>
      </div>

      <div className="space-y-4">
        {rows.map(({ project, business, owner }) => {
          const projectAssets = files
            .filter(({ link }) => link.projectId === project.id)
            .map(({ link, asset }) => ({
              mediaId: asset.id,
              downloadUrl: new URL(storage.publicUrl(asset.storageKey), env.APP_URL).toString(),
              filename: asset.filename,
              kind: link.kind,
              dishOrAssetName: asset.label,
              customerInstructions: asset.customerNotes,
              workflowStatus: asset.workflowStatus,
              mime: asset.mime,
              size: asset.size,
            }));
          const brief = makeImplementationBrief({
            projectId: project.id,
            submittedAt: project.createdAt,
            status: project.status,
            business: { id: business.id, name: business.name, nameEn: business.nameEn, slug: business.slug, businessType: business.businessType },
            owner,
            configuration: project.configuration,
            assets: projectAssets,
          });
          const json = JSON.stringify(brief, null, 2);
          const estimate = brief.submittedEstimate;
          return (
            <Card key={project.id}>
              <CardContent>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black">{business.name}</h2>
                      <Badge>{project.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted" dir="ltr">{owner?.email ?? "—"} · {formatDateTime(project.createdAt, l)}</p>
                    <p className="mt-1 font-mono text-xs text-muted" dir="ltr">{project.id}</p>
                  </div>
                  <CopyBuildBrief value={json} fa={fa} />
                </div>

                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl bg-subtle p-3"><dt className="text-xs text-muted">{fa ? "دمو / طراحی" : "Demo / design"}</dt><dd className="mt-1 font-bold">{String(brief.design.sourceDemo ?? "—")}</dd></div>
                  <div className="rounded-xl bg-subtle p-3"><dt className="text-xs text-muted">{fa ? "زبان‌ها" : "Languages"}</dt><dd className="mt-1 font-bold">{Array.isArray(brief.menuContent.languages) ? brief.menuContent.languages.join(", ") || "—" : String(brief.menuContent.languages)}</dd></div>
                  <div className="rounded-xl bg-subtle p-3"><dt className="text-xs text-muted">{fa ? "شعبه / منو" : "Branches / menus"}</dt><dd className="mt-1 font-bold">{String(brief.branches.totalLocations)} · {String(brief.branches.menuMode)}</dd></div>
                  <div className="rounded-xl bg-subtle p-3"><dt className="text-xs text-muted">{fa ? "برآورد اولیه" : "Initial estimate"}</dt><dd className="mt-1 font-bold accent-text">{typeof estimate.initialTotal === "number" ? formatToman(estimate.initialTotal, l) : "—"}</dd></div>
                </dl>

                <details className="group mt-5 rounded-xl border border-line bg-elevated p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-extrabold marker:content-none">
                    <span className="flex items-center gap-2"><FileText className="size-4" aria-hidden="true" />{fa ? "مشاهده تمام گزینه‌ها و JSON ساخت" : "View every option and build JSON"}</span>
                    <span className="text-xs text-muted transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                  </summary>
                  <pre className="mt-4 max-h-[42rem] overflow-auto rounded-xl bg-app p-4 text-left font-mono text-xs leading-6" dir="ltr"><code>{json}</code></pre>
                </details>

                {projectAssets.length ? (
                  <div className="mt-5">
                    <h3 className="flex items-center gap-2 font-extrabold"><ImageIcon className="size-4" aria-hidden="true" />{fa ? "فایل‌ها و عکس‌های نام‌گذاری‌شده" : "Named files and food photos"}</h3>
                    <ul className="mt-3 grid gap-2 md:grid-cols-2">
                      {projectAssets.map((asset) => <li key={asset.mediaId} className="rounded-xl border border-line p-3 text-sm"><p className="font-bold">{asset.dishOrAssetName || asset.filename}</p><p className="mt-1 text-xs text-muted" dir="ltr">{asset.kind} · {asset.filename}</p>{asset.customerInstructions ? <p className="mt-2 text-xs leading-5">{asset.customerInstructions}</p> : null}<a href={asset.downloadUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-bold accent-text underline-offset-4 hover:underline">{fa ? "مشاهده / دریافت فایل" : "View / download file"}</a></li>)}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
        {rows.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">{fa ? "هنوز سفارشی ثبت نشده است." : "No build orders have been submitted yet."}</p> : null}
      </div>
    </div>
  );
}
