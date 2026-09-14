import { inArray, desc, eq } from "drizzle-orm";
import { requireUser } from "@/domains/auth/guards";
import { getMyBusinesses } from "@/domains/dashboard/data";
import { getDb } from "@/domains/db/client";
import { serviceRequests, serviceQuotes, serviceRequestMessages, user } from "@/domains/db/schema/index";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { formatToman, formatDateTime } from "@/domains/i18n/format";
import { Card, CardContent, Badge } from "@/components/ui/primitives";
import { NewRequestForm } from "./new-request-form";
import { ChatComposer } from "@/components/creator/chat-composer";
import { QuoteActions } from "./quote-actions";
import { safeMediaUrl } from "@/domains/storage/attachments";

export default async function RequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);
  const session = await requireUser(`/${l}/dashboard/requests`);

  const memberships = await getMyBusinesses(session.user.id);
  const bizIds = memberships.map((m) => m.business.id);
  const db = getDb();

  const requests = bizIds.length
    ? await db
        .select()
        .from(serviceRequests)
        .where(inArray(serviceRequests.businessId, bizIds))
        .orderBy(desc(serviceRequests.createdAt))
        .limit(50)
    : [];

  const quotes = requests.length
    ? await db
        .select()
        .from(serviceQuotes)
        .where(inArray(serviceQuotes.requestId, requests.map((r) => r.id)))
        .orderBy(desc(serviceQuotes.createdAt))
    : [];
  const messages = requests.length
    ? await db.select({ message: serviceRequestMessages, author: user }).from(serviceRequestMessages).leftJoin(user, eq(serviceRequestMessages.authorUserId, user.id)).where(inArray(serviceRequestMessages.requestId, requests.map((r) => r.id))).orderBy(serviceRequestMessages.createdAt)
    : [];

  return (
    <div className="space-y-6">
      <h1 className="display-3">{t.dashboard.requests}</h1>

      <NewRequestForm
        businessId={memberships[0]?.business.id ?? ""}
        locale={l}
        labels={{
          newRequest: t.dashboard.newRequest,
          category: t.dashboard.requestCategory,
          categories: t.dashboard.requestCategories,
          title: t.dashboard.requestTitle,
          description: t.dashboard.requestDescription,
          urgency: t.dashboard.requestUrgency,
          normal: t.dashboard.normal,
          urgent: t.dashboard.urgent,
          submit: t.common.submitRequest,
          error: t.common.error,
        }}
      />

      <div className="space-y-3">
        {requests.length === 0 ? (
          <p className="text-sm text-muted">{t.common.empty}</p>
        ) : (
          requests.map((r) => {
            const quote = quotes.find((q) => q.requestId === r.id && q.status !== "waived");
            return (
              <Card key={r.id}>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold">{r.title}</span>
                      <Badge variant={r.status === "closed" ? "neutral" : r.status === "open" ? "warning" : "default"}>
                        {t.dashboard.requestStatus[r.status as keyof typeof t.dashboard.requestStatus] ?? r.status}
                      </Badge>
                      {r.urgency === "urgent" ? <Badge variant="danger">{t.dashboard.urgent}</Badge> : null}
                    </div>
                    <span className="text-xs text-muted" dir="ltr">{r.number}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{r.body}</p>
                  <p className="mt-1 text-xs text-muted">{formatDateTime(r.createdAt, l)}</p>

                  {quote && quote.status === "pending" ? (
                    <div className="mt-4 rounded-xl bg-[var(--accent-soft)] p-4">
                      <p className="text-sm">
                        <strong>{t.dashboard.quoteFor}</strong> «{r.title}»:{" "}
                        <span className="text-lg font-black accent-text">{formatToman(quote.amount, l)}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted">{quote.scope}</p>
                      {Array.isArray(quote.attachments) && quote.attachments.length ? <div className="mt-2 flex flex-wrap gap-2">{(quote.attachments as {mediaId:string;url:string;filename:string}[]).map((item)=>{ const href = safeMediaUrl(item.url); return href ? <a key={item.mediaId} href={href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-line bg-elevated px-3 py-2 text-xs font-bold">{item.filename}</a> : null; })}</div> : null}
                      <QuoteActions quoteId={quote.id} locale={l} />
                    </div>
                  ) : quote ? <p className="mt-4 text-xs font-bold text-muted">{l === "fa" ? `وضعیت استعلام: ${quote.status}` : `Quote status: ${quote.status}`}</p> : null}
                  <div className="mt-5 space-y-2 border-t border-line pt-4">
                    {messages.filter(({message}) => message.requestId === r.id && !message.isInternal).map(({message,author}) => { const mine = message.authorUserId === session.user.id; const attachments = (message.attachments ?? []) as {mediaId:string;url:string;filename:string}[]; return <div key={message.id} className={`max-w-[88%] rounded-xl p-3 ${mine ? "ms-auto accent-soft-bg" : "me-auto bg-subtle"}`}><p className="mb-1 text-[10px] font-bold text-muted">{mine ? (l === "fa" ? "شما" : "You") : author?.name || (l === "fa" ? "پشتیبانی" : "Support")}</p><p className="whitespace-pre-wrap text-sm">{message.body}</p>{attachments.length ? <div className="mt-2 flex flex-wrap gap-2">{attachments.map((item) => { const href = safeMediaUrl(item.url); return href ? <a key={item.mediaId} href={href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-line bg-elevated px-3 py-2 text-xs font-bold">{item.filename}</a> : null; })}</div> : null}<time className="mt-1 block text-[10px] text-muted">{formatDateTime(message.createdAt, l)}</time></div>})}
                    <ChatComposer requestId={r.id} businessId={r.businessId} locale={l} />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
