import { requireCreator } from "@/domains/auth/guards";
import { isLocale } from "@/domains/i18n/config";
import { formatToman } from "@/domains/i18n/format";
import { getCreatorQuotes } from "@/domains/creator/data";
import { QuoteForm } from "@/app/[locale]/admin/requests/quote-form";
import { Badge, Card, CardContent } from "@/components/ui/primitives";

export default async function QuotesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  await requireCreator(`/${l}/creator/quotes`);
  const data = await getCreatorQuotes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-3">{fa ? "سفارش‌ها و هزینه‌های سفارشی" : "Orders & custom charges"}</h1>
        <p className="mt-1 text-sm text-muted">
          {fa ? "برآورد ثبت‌شده را بررسی کنید و توضیح دلخواه خود را برای مشتری بفرستید." : "Review the submitted estimate and send your own scope note to the client."}
        </p>
      </div>
      <div className="space-y-3">
        {data.requests.map(({ request, business, project }) => {
          const quote = data.quotes.find((item) => item.requestId === request.id);
          const estimate = (project?.configuration as { estimateAtSubmission?: { initialTotal?: number } } | null)?.estimateAtSubmission?.initialTotal ?? 0;
          return (
            <Card key={request.id}>
              <CardContent>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-extrabold">{request.title}</h2>
                    <p className="mt-1 text-xs text-muted">{business.name} · {request.number}</p>
                  </div>
                  {quote ? <Badge variant={quote.status === "approved" ? "success" : "default"}>{quote.status} · {formatToman(quote.amount, l)}</Badge> : <Badge variant="warning">{fa ? "بدون استعلام" : "Not quoted"}</Badge>}
                </div>
                <p className="mt-3 text-sm text-muted">{request.body}</p>
                {estimate > 0 ? <p className="mt-2 text-xs font-bold accent-text">{fa ? "برآورد سازنده:" : "Builder estimate:"} {formatToman(estimate, l)}</p> : null}
                <QuoteForm
                  requestId={request.id}
                  businessId={request.businessId}
                  defaultAmount={estimate}
                  labels={{
                    issueQuote: fa ? "ارسال هزینه" : "Send charge",
                    amount: fa ? "مبلغ" : "Amount",
                    scope: fa ? "پیام و شرح کار" : "Message & scope",
                    attachment: fa ? "پیوست تصویر یا PDF" : "Attach image or PDF",
                    waiveFee: fa ? "رایگان" : "Waive",
                    send: fa ? "ارسال برای مشتری" : "Send to client",
                    error: fa ? "ارسال ناموفق بود" : "Could not send",
                  }}
                />
              </CardContent>
            </Card>
          );
        })}
        {!data.requests.length ? <p className="text-sm text-muted">{fa ? "سفارشی ثبت نشده است." : "No orders yet."}</p> : null}
      </div>
    </div>
  );
}
