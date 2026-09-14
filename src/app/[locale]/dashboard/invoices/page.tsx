import { requireUser } from "@/domains/auth/guards";
import { getDashboardOverview } from "@/domains/dashboard/data";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { formatToman, formatDateTime } from "@/domains/i18n/format";
import { Card, CardContent, Badge, EmptyState } from "@/components/ui/primitives";
import { PayInvoiceButton } from "./pay-invoice-button";

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  const session = await requireUser(`/${l}/dashboard/invoices`);
  const data = await getDashboardOverview(session.user.id);

  if (!data) return <EmptyState title={t.dashboard.noProjects} />;
  const { invoices, business } = data;

  return (
    <div className="space-y-6">
      <h1 className="display-3">{t.dashboard.invoices}</h1>
      {invoices.length === 0 ? (
        <p className="text-sm text-muted">{t.common.empty}</p>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const payable = inv.status === "sent" || inv.status === "partially_paid";
            return (
              <Card key={inv.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold" dir="ltr">{inv.number}</span>
                      <Badge variant={inv.status === "paid" ? "success" : payable ? "warning" : "neutral"}>
                        {t.dashboard.invoiceStatus[inv.status as keyof typeof t.dashboard.invoiceStatus] ?? inv.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted">{formatDateTime(inv.createdAt, l)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <p className="text-lg font-black">{formatToman(inv.total, l)}</p>
                      {inv.paidTotal > 0 && inv.paidTotal < inv.total ? (
                        <p className="text-xs text-muted">
                          {fa ? "پرداخت‌شده" : "paid"}: {formatToman(inv.paidTotal, l)}
                        </p>
                      ) : null}
                    </div>
                    {payable ? (
                      <PayInvoiceButton
                        businessId={business.id}
                        invoiceId={inv.id}
                        label={t.dashboard.payInvoice}
                        errorLabel={t.common.error}
                      />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
