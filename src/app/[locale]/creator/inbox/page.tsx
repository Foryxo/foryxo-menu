import Link from "next/link";
import { requireCreator } from "@/domains/auth/guards";
import { isLocale } from "@/domains/i18n/config";
import { formatDateTime } from "@/domains/i18n/format";
import { getCreatorInbox } from "@/domains/creator/data";
import { ChatComposer } from "@/components/creator/chat-composer";
import { safeMediaUrl } from "@/domains/storage/attachments";

type Attachment = { mediaId: string; url: string; filename: string; mime: string };

export default async function InboxPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ request?: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const { session } = await requireCreator(`/${l}/creator/inbox`);
  const data = await getCreatorInbox();
  const sp = await searchParams;
  const selected = data.requests.find((row) => row.request.id === sp.request) ?? data.requests[0];
  const messages = selected ? data.messages.filter(({ message }) => message.requestId === selected.request.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-3">{fa ? "گفت‌وگو با مشتریان" : "Client conversations"}</h1>
        <p className="mt-1 text-sm text-muted">{fa ? "هر درخواست یک گفت‌وگوی خصوصی و قابل پیگیری دارد." : "Every request has a private, traceable conversation."}</p>
      </div>
      <div className="grid min-h-[620px] gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="surface overflow-hidden rounded-2xl">
          <div className="border-b border-line p-4 text-sm font-extrabold">{fa ? "گفت‌وگوها" : "Threads"}</div>
          <div className="max-h-[560px] overflow-y-auto p-2">
            {data.requests.map(({ request, business }) => (
              <Link key={request.id} href={`/${l}/creator/inbox?request=${request.id}`} className={`block rounded-xl p-3 text-sm transition-colors ${selected?.request.id === request.id ? "accent-soft-bg" : "hover:bg-subtle"}`}>
                <p className="truncate font-bold">{request.title}</p>
                <p className="mt-1 truncate text-xs text-muted">{business.name} · {request.number}</p>
              </Link>
            ))}
            {!data.requests.length ? <p className="p-3 text-sm text-muted">{fa ? "پیامی وجود ندارد." : "No conversations yet."}</p> : null}
          </div>
        </aside>
        <section className="surface flex min-h-[620px] flex-col rounded-2xl p-4">
          {selected ? <>
            <header className="border-b border-line pb-4">
              <h2 className="font-extrabold">{selected.request.title}</h2>
              <p className="mt-1 text-xs text-muted">{selected.business.name} · {selected.request.number}</p>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto py-4">
              {messages.map(({ message, author }) => {
                const attachments = (message.attachments ?? []) as Attachment[];
                const mine = message.authorUserId === session.user.id;
                return <article key={message.id} className={`max-w-[88%] rounded-2xl p-3 ${mine ? "ms-auto accent-soft-bg" : "me-auto bg-subtle"}`}>
                  <p className="mb-1 text-[10px] font-bold text-muted">{mine ? (fa ? "شما" : "You") : author?.name || (fa ? "مشتری" : "Customer")}</p>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                  {attachments.length ? <div className="mt-2 flex flex-wrap gap-2">{attachments.map((a) => { const href = safeMediaUrl(a.url); return href ? <a key={a.mediaId} href={href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-line bg-elevated px-3 py-2 text-xs font-bold hover:text-[var(--accent)]">{a.filename}</a> : null; })}</div> : null}
                  <time className="mt-2 block text-[10px] text-muted">{formatDateTime(message.createdAt, l)}</time>
                </article>;
              })}
              {!messages.length ? <p className="text-sm text-muted">{fa ? "اولین پیام را ارسال کنید." : "Send the first message."}</p> : null}
            </div>
            <ChatComposer requestId={selected.request.id} businessId={selected.request.businessId} locale={l} />
          </> : <div className="grid flex-1 place-items-center text-sm text-muted">{fa ? "درخواستی برای نمایش نیست." : "No request to show."}</div>}
        </section>
      </div>
    </div>
  );
}
