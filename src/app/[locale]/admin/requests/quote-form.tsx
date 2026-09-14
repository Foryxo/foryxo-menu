"use client";

import { useRef, useState, type FormEvent } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/primitives";

interface Labels {
  issueQuote: string;
  amount: string;
  scope: string;
  attachment: string;
  waiveFee: string;
  send: string;
  error: string;
}

type Attachment = {
  mediaId: string;
  url: string;
  filename: string;
  mime: string;
};

export function QuoteForm({
  requestId,
  businessId,
  defaultAmount = 0,
  canWaive = false,
  labels: L,
}: {
  requestId: string;
  businessId: string;
  defaultAmount?: number;
  canWaive?: boolean;
  labels: Labels;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(defaultAmount));
  const [scope, setScope] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("businessId", businessId);
      form.set("kind", "quote_attachment");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error("upload_failed");
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
      setError(L.error);
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: FormEvent, waive: boolean) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          amount: waive ? 0 : Number(amount.replace(/\D/g, "")),
          scope: scope.slice(0, 500) || (waive ? "complimentary" : "—"),
          attachments,
          waive,
        }),
      });
      if (res.ok) {
        setOpen(false);
        window.location.reload();
      } else {
        setError(L.error);
      }
    } catch {
      setError(L.error);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="mt-3"
        onClick={() => setOpen(true)}
      >
        {L.issueQuote}
      </Button>
    );
  }

  return (
    <form
      className="mt-4 grid gap-3 rounded-xl bg-subtle p-4 sm:grid-cols-2"
      onSubmit={(e) => submit(e, false)}
    >
      <label className="text-sm font-medium">
        <span className="mb-1.5 block">{L.amount} (Toman)</span>
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          dir="ltr"
          required
        />
      </label>
      <label className="text-sm font-medium">
        <span className="mb-1.5 block">{L.scope}</span>
        <Textarea
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          rows={2}
          maxLength={500}
        />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" loading={busy}>
          {L.send}
        </Button>
        {canWaive ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={(e) => submit(e, true)}
          >
            {L.waiveFee}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          ×
        </Button>
      </div>
      <div className="sm:col-span-2">
        <input
          ref={fileRef}
          type="file"
          aria-label={L.attachment}
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.currentTarget.value = "";
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy || attachments.length >= 6}
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="size-4" /> {L.attachment}
        </Button>
        {attachments.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((item) => (
              <span
                key={item.mediaId}
                className="inline-flex items-center gap-1 rounded-full bg-elevated px-2.5 py-1 text-xs"
              >
                <Paperclip className="size-3" />
                {item.filename}
                <button
                  type="button"
                  onClick={() =>
                    setAttachments((items) =>
                      items.filter((a) => a.mediaId !== item.mediaId),
                    )
                  }
                  aria-label="Remove"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-red-600 sm:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
