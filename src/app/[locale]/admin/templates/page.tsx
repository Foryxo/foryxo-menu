import { requireAdmin } from "@/domains/auth/guards";
import { getDb } from "@/domains/db/client";
import { messageTemplates } from "@/domains/db/schema/index";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { Badge } from "@/components/ui/primitives";

export default async function AdminTemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  await requireAdmin(`/${l}/admin/templates`, ["superadmin", "admin", "support", "editor"]);
  const db = getDb();
  const rows = await db.select().from(messageTemplates);

  const VARIABLES = [
    "{{customer_name}}", "{{business_name}}", "{{menu_name}}", "{{request_title}}",
    "{{price}}", "{{currency}}", "{{estimated_scope}}", "{{payment_link}}",
    "{{wallet_balance}}", "{{domain}}", "{{menu_url}}", "{{invoice_number}}",
  ];

  // Group by scenario; show FA + EN side by side.
  const byScenario = new Map<string, { fa?: typeof rows[number]; en?: typeof rows[number] }>();
  for (const r of rows) {
    const entry = byScenario.get(r.scenario) ?? {};
    if (r.locale === "fa") entry.fa = r;
    else entry.en = r;
    byScenario.set(r.scenario, entry);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-3">{t.admin.templates}</h1>
        <p className="mt-1 text-sm text-muted">
          {fa
            ? "قالب‌های پیام دوزبانه با متغیرهای جایگزین‌شونده."
            : "Bilingual message templates with substitution variables."}
        </p>
      </div>

      <div className="surface rounded-2xl p-4">
        <h2 className="text-sm font-extrabold">{t.admin.variables}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {VARIABLES.map((v) => (
            <code key={v} className="rounded bg-subtle px-2 py-0.5 font-mono text-xs" dir="ltr">{v}</code>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {[...byScenario.entries()].map(([scenario, pair]) => (
          <div key={scenario} className="surface rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold">{scenario}</h2>
              {pair.fa ? <Badge>FA</Badge> : <Badge variant="danger">FA missing</Badge>}
              {pair.en ? <Badge>EN</Badge> : <Badge variant="danger">EN missing</Badge>}
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {(["fa", "en"] as const).map((loc) => {
                const tpl = pair[loc];
                return (
                  <div key={loc} className="rounded-xl bg-subtle p-3">
                    <p className="text-xs font-bold text-muted" dir={loc === "fa" ? "rtl" : "ltr"}>
                      {tpl?.subject ?? (loc === "fa" ? "موجود نیست" : "missing")}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6" dir={loc === "fa" ? "rtl" : "ltr"}>
                      {tpl?.body ?? "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="text-sm text-muted">
            {fa ? "قالبی یافت نشد — `npm run db:seed` را اجرا کنید." : "No templates found — run `npm run db:seed`."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
