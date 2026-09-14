import { requireAdmin } from "@/domains/auth/guards";
import { getAdminRequests } from "@/domains/admin/data";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { formatDateTime } from "@/domains/i18n/format";
import { Card, CardContent, Badge } from "@/components/ui/primitives";
import { QuoteForm } from "./quote-form";
import { ChatComposer } from "@/components/creator/chat-composer";
import { getDb } from "@/domains/db/client";
import { serviceRequestMessages, user } from "@/domains/db/schema/index";
import { eq, inArray } from "drizzle-orm";

export default async function AdminRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  const { role } = await requireAdmin(`/${l}/admin/requests`, ["superadmin", "admin", "support"]);
  const rows = await getAdminRequests();
  const messages = rows.length
    ? await getDb()
        .select({ message: serviceRequestMessages, author: user })
        .from(serviceRequestMessages)
        .leftJoin(user, eq(serviceRequestMessages.authorUserId, user.id))
        .where(inArray(serviceRequestMessages.requestId, rows.map(({ request }) => request.id)))
        .orderBy(serviceRequestMessages.createdAt)
    : [];

  return (
    <div className="space-y-6">
      <h1 className="display-3">{t.admin.requests}</h1>
      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">{t.common.empty}</p>
        ) : (
          rows.map(({ request, business, project }) => (
            <Card key={request.id}>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold">{request.title}</span>
                    <Badge variant={request.status === "open" ? "warning" : request.status === "closed" ? "neutral" : "default"}>
                      {t.dashboard.requestStatus[request.status as keyof typeof t.dashboard.requestStatus] ?? request.status}
                    </Badge>
                    {request.urgency === "urgent" ? <Badge variant="danger">{t.dashboard.urgent}</Badge> : null}
                  </div>
                  <span className="text-xs text-muted">{business.name} · {formatDateTime(request.createdAt, l)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{request.body}</p>
                <p className="mt-1 text-xs text-muted" dir="ltr">{request.number} · {request.category}</p>

                {["open", "quoted"].includes(request.status) ? (
                  <QuoteForm
                    requestId={request.id}
                    businessId={request.businessId}
                    defaultAmount={((project?.configuration as { estimateAtSubmission?: { initialTotal?: number } } | null)?.estimateAtSubmission?.initialTotal) ?? 0}
                    canWaive={["superadmin", "admin"].includes(role)}
                    labels={{
                      issueQuote: t.admin.issueQuote,
                      amount: t.pricing.price,
                      scope: fa ? "شرح کار" : "Scope",
                      attachment: fa ? "پیوست تصویر یا PDF" : "Attach image or PDF",
                      waiveFee: t.admin.waiveFee,
                      send: t.admin.send,
                      error: t.common.error,
                    }}
                  />
                ) : null}
                <div className="mt-5 space-y-2 border-t border-line pt-4">
                  <p className="text-xs font-extrabold text-muted">{fa ? "گفت‌وگوی مشتری" : "Customer conversation"}</p>
                  {messages.filter(({ message }) => message.requestId === request.id && !message.isInternal).map(({ message, author }) => (
                    <div key={message.id} className="max-w-[88%] rounded-xl bg-subtle p-3">
                      <p className="mb-1 text-[10px] font-bold text-muted">{author?.name || (fa ? "کاربر" : "User")}</p>
                      <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                      <time className="mt-1 block text-[10px] text-muted">{formatDateTime(message.createdAt, l)}</time>
                    </div>
                  ))}
                  <ChatComposer requestId={request.id} businessId={request.businessId} locale={l} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
