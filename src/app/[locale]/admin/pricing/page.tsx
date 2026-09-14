import { requireAdmin } from "@/domains/auth/guards";
import { getDb } from "@/domains/db/client";
import { priceCatalog } from "@/domains/db/schema/index";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { formatToman } from "@/domains/i18n/format";
import { Badge } from "@/components/ui/primitives";
import { desc } from "drizzle-orm";

export default async function AdminPricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  await requireAdmin(`/${l}/admin/pricing`, ["superadmin", "admin", "finance"]);
  const db = getDb();
  const rows = await db.select().from(priceCatalog).orderBy(desc(priceCatalog.effectiveFrom));

  const categoryLabel: Record<string, string> = fa
    ? {
        package: "پکیج", addon: "افزودنی", content: "محتوا", design: "طراحی",
        language: "زبان", ordering: "سفارش‌گیری", domain: "دامنه", hosting: "هاستینگ",
        support: "پشتیبانی", urgent: "فوری", custom: "سفارشی",
      }
    : {
        package: "Package", addon: "Add-on", content: "Content", design: "Design",
        language: "Language", ordering: "Ordering", domain: "Domain", hosting: "Hosting",
        support: "Support", urgent: "Urgent", custom: "Custom",
      };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-3">{t.admin.pricing}</h1>
        <p className="mt-1 text-sm text-muted">
          {fa
            ? "قیمت‌ها از کاتالوگ داده‌محور خوانده می‌شوند؛ تغییر با effective_from ثبت می‌شود و فاکتورهای تاریخی بازنویسی نمی‌شوند."
            : "Prices come from the data-driven catalog; changes take effect with effective_from and never rewrite historical invoices."}
        </p>
      </div>

      <div className="surface overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="p-3 text-start font-semibold">Key</th>
              <th className="p-3 text-start font-semibold">{fa ? "دسته" : "Category"}</th>
              <th className="p-3 text-start font-semibold">{fa ? "برچسب مشتری" : "Customer label"}</th>
              <th className="p-3 text-end font-semibold">{fa ? "پیش‌فرض" : "Default"}</th>
              <th className="p-3 text-start font-semibold">{fa ? "بازه" : "Range"}</th>
              <th className="p-3 text-start font-semibold">{fa ? "تکرارشونده" : "Recurring"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="p-3 font-mono text-xs" dir="ltr">{r.key}</td>
                <td className="p-3">{categoryLabel[r.category] ?? r.category}</td>
                <td className="p-3 font-semibold">{fa ? r.customerLabelFa : r.customerLabelEn}</td>
                <td className="p-3 text-end font-bold">{formatToman(r.defaultPrice, l)}</td>
                <td className="p-3 text-xs text-muted" dir="ltr">
                  {r.minPrice ?? "—"} … {r.maxPrice ?? "—"}
                </td>
                <td className="p-3">
                  {r.isRecurring ? <Badge variant="default">{r.recurringPeriod ?? "annual"}</Badge> : <Badge variant="neutral">—</Badge>}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted">
                  {fa ? "کاتالوگ خالی است — `npm run db:seed` را اجرا کنید." : "Catalog empty — run `npm run db:seed`."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
