import { requireAdmin } from "@/domains/auth/guards";
import { getAdminPayments } from "@/domains/admin/data";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { formatToman, formatDateTime } from "@/domains/i18n/format";
import { Card, CardContent, Badge } from "@/components/ui/primitives";
import { RefundDecision } from "./refund-decision";

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  await requireAdmin(`/${l}/admin/payments`, ["superadmin", "admin", "finance"]);
  const { payments, refunds } = await getAdminPayments();

  return (
    <div className="space-y-8">
      <h1 className="display-3">{t.admin.payments}</h1>

      <div className="surface overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="p-3 text-start font-semibold">{fa ? "کسب‌وکار" : "Business"}</th>
              <th className="p-3 text-start font-semibold">{fa ? "ارائه‌دهنده" : "Provider"}</th>
              <th className="p-3 text-start font-semibold">{fa ? "مبلغ" : "Amount"}</th>
              <th className="p-3 text-start font-semibold">{fa ? "وضعیت" : "Status"}</th>
              <th className="p-3 text-start font-semibold">{fa ? "هدف" : "Purpose"}</th>
              <th className="p-3 text-start font-semibold">{fa ? "تاریخ" : "Date"}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(({ payment, business }) => (
              <tr key={payment.id} className="border-b border-line last:border-0">
                <td className="p-3 font-bold">{business.name}</td>
                <td className="p-3" dir="ltr">{payment.provider}</td>
                <td className="p-3 font-bold">{formatToman(payment.amount, l)}</td>
                <td className="p-3">
                  <Badge variant={payment.status === "paid" ? "success" : payment.status === "failed" ? "danger" : "warning"}>
                    {payment.status}
                  </Badge>
                </td>
                <td className="p-3 text-muted">{payment.purpose}</td>
                <td className="p-3 text-muted">{formatDateTime(payment.createdAt, l)}</td>
              </tr>
            ))}
            {payments.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted">{t.common.empty}</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <h2 className="display-3">{t.admin.refunds}</h2>
      <div className="space-y-3">
        {refunds.length === 0 ? (
          <p className="text-sm text-muted">{t.common.empty}</p>
        ) : (
          refunds.map(({ refund, business }) => (
            <Card key={refund.id}>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold">{formatToman(refund.amount, l)}</span>
                    <Badge variant={refund.status === "completed" ? "success" : refund.status === "rejected" ? "danger" : "warning"}>
                      {refund.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted">{business.name} · {formatDateTime(refund.createdAt, l)}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{refund.reason}</p>
                {["requested", "reviewing"].includes(refund.status) ? (
                  <RefundDecision refundId={refund.id} labels={{ approve: t.admin.approve, reject: t.admin.reject, rejectReason: t.admin.rejectReason, error: t.common.error }} />
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
