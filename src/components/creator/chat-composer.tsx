"use client";

import { useRef, useState, type FormEvent } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/primitives";

type Attachment = {
  mediaId: string;
  url: string;
  filename: string;
  mime: string;
};

export function ChatComposer({
  requestId,
  businessId,
  locale,
}: {
  requestId: string;
  businessId: string;
  locale: "fa" | "en";
}) {
  const fa = locale === "fa";
  const fileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("businessId", businessId);
      form.set("kind", "chat_attachment");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAttachments((items) => [
        ...items,
        {
          mediaId: data.mediaId,
          url: data.url,
          filename: file.name,
          mime: file.type,
        },
      ]);
    } catch {
      setError(fa ? "بارگذاری فایل ناموفق بود." : "File upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim() && !attachments.length) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          body: body.trim() || (fa ? "پیوست" : "Attachment"),
          attachments,
        }),
      });
      if (!res.ok) throw new Error("send_failed");
      setBody("");
      setAttachments([]);
      window.location.reload();
    } catch {
      setError(
        fa
          ? "پیام ارسال نشد. دوباره تلاش کنید."
          : "Message failed to send. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-2xl border border-line bg-elevated p-3"
    >
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={3000}
        placeholder={fa ? "پیام شما…" : "Your message…"}
        aria-label={fa ? "پیام" : "Message"}
      />
      {attachments.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachments.map((item) => (
            <span
              key={item.mediaId}
              className="inline-flex items-center gap-1 rounded-full bg-subtle px-3 py-1 text-xs font-bold"
            >
              <Paperclip className="size-3" />
              {item.filename}
              <button
                type="button"
                onClick={() =>
                  setAttachments((items) =>
                    items.filter((x) => x.mediaId !== item.mediaId),
                  )
                }
                aria-label={fa ? "حذف پیوست" : "Remove attachment"}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            aria-label={fa ? "افزودن پیوست" : "Add attachment"}
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.currentTarget.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="size-4" />
          {fa ? "پیوست" : "Attach"}
        </Button>
        <Button
          type="submit"
          size="sm"
          loading={busy}
          disabled={!body.trim() && !attachments.length}
        >
          <Send className="size-4" />
          {fa ? "ارسال" : "Send"}
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
