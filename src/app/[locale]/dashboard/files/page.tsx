import { requireUser } from "@/domains/auth/guards";
import { getDashboardOverview } from "@/domains/dashboard/data";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { toPersianDigits } from "@/domains/i18n/normalize";
import { Card, CardContent, EmptyState } from "@/components/ui/primitives";
import { FileUpload } from "./file-upload";

export default async function FilesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  const session = await requireUser(`/${l}/dashboard/files`);
  const data = await getDashboardOverview(session.user.id);

  if (!data) return <EmptyState title={t.dashboard.noProjects} />;
  const nd = (n: number | string) => (fa ? toPersianDigits(n) : String(n));

  return (
    <div className="space-y-6">
      <h1 className="display-3">{t.dashboard.files}</h1>
      <p className="max-w-3xl text-sm leading-7 text-muted">
        {fa
          ? "عکس‌های غذای خود را نام‌گذاری و یک‌جا ارسال کنید. وضعیت ویرایش هر تصویر در همین صفحه به‌روز می‌شود."
          : "Name and send your food photos in one batch. The editing status of every image is updated on this page."}
      </p>

      <FileUpload
        businessId={data.business.id}
        locale={l}
        labels={{
          upload: t.dashboard.upload,
          dragDrop: t.dashboard.dragDrop,
          error: t.common.error,
        }}
      />

      <Card>
        <CardContent>
          {data.files.length === 0 ? (
            <p className="text-sm text-muted">{t.dashboard.filesEmpty}</p>
          ) : (
            <ul className="divide-y divide-[var(--line)] text-sm">
              {data.files.map((f) => (
                <li key={f.id} className="flex items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{f.label || f.filename}</p>
                    <p className="text-xs text-muted">
                      {f.filename} · {nd(Math.round(f.size / 1024))} KB
                    </p>
                    {f.customerNotes ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{f.customerNotes}</p> : null}
                  </div>
                  <Badge_>
                    {f.kind === "food_photo"
                      ? ({ received: fa ? "دریافت شد" : "Received", editing: fa ? "در حال ویرایش" : "Editing", ready: fa ? "آماده" : "Ready", placed: fa ? "در منو" : "Placed", needs_info: fa ? "نیازمند توضیح" : "Needs info" }[f.workflowStatus] ?? f.workflowStatus)
                      : f.kind}
                  </Badge_>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Badge_({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-subtle px-2.5 py-0.5 text-xs font-semibold text-muted">
      {children}
    </span>
  );
}
