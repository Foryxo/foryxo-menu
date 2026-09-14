import { requireUser } from "@/domains/auth/guards";
import { getDashboardOverview } from "@/domains/dashboard/data";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { formatToman, formatDateTime } from "@/domains/i18n/format";
import { Card, CardContent, EmptyState } from "@/components/ui/primitives";
import { WalletActions } from "./wallet-actions";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  const session = await requireUser(`/${l}/dashboard/wallet`);
  const data = await getDashboardOverview(session.user.id);

  if (!data) {
    return <EmptyState title={t.dashboard.noProjects} />;
  }

  const { account, ledger, business } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-3">{t.dashboard.walletTitle}</h1>
        <p className="mt-1 text-sm text-muted">{t.dashboard.walletSubtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-xs text-muted">{t.dashboard.available}</p>
            <p className="mt-1 text-2xl font-black accent-text">
              {account ? formatToman(account.balanceCached, l) : formatToman(0, l)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted">{t.dashboard.onHold}</p>
            <p className="mt-1 text-2xl font-black">{account ? formatToman(account.holdsCached, l) : formatToman(0, l)}</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent>
            <p className="text-xs font-bold">{t.dashboard.refundOnlyUnused}</p>
            <p className="mt-1 text-[11px] leading-4 text-muted">{t.dashboard.refundNote}</p>
          </CardContent>
        </Card>
      </div>

      <WalletActions
        businessId={business.id}
        locale={l}
        labels={{
          topup: t.dashboard.topup,
          topupAmount: t.dashboard.topupAmount,
          addCredit: t.common.addCredit,
          requestRefund: t.dashboard.requestRefund,
          refundAmount: t.dashboard.requestRefundAmount,
          submitRequest: t.common.submitRequest,
          refundNote: t.dashboard.refundNote,
          toman: t.common.toman,
          error: t.common.error,
        }}
      />

      <Card>
        <CardContent>
          <h2 className="mb-3 font-extrabold">{t.dashboard.transactions}</h2>
          {ledger.length === 0 ? (
            <p className="text-sm text-muted">{t.common.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-start text-xs text-muted">
                    <th className="py-2 text-start font-semibold">{fa ? "تاریخ" : "Date"}</th>
                    <th className="py-2 text-start font-semibold">{fa ? "نوع" : "Type"}</th>
                    <th className="py-2 text-start font-semibold">{fa ? "شرح" : "Description"}</th>
                    <th className="py-2 text-end font-semibold">{fa ? "مبلغ" : "Amount"}</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((e) => (
                    <tr key={e.id} className="border-b border-line last:border-0">
                      <td className="py-2.5 text-muted">{formatDateTime(e.createdAt, l)}</td>
                      <td className="py-2.5 font-semibold">
                        {t.dashboard.ledger[e.category as keyof typeof t.dashboard.ledger] ?? e.category}
                      </td>
                      <td className="max-w-48 truncate py-2.5 text-muted">{e.description}</td>
                      <td className={`py-2.5 text-end font-bold ${e.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {e.amount >= 0 ? "+" : "−"}{formatToman(Math.abs(e.amount), l)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
