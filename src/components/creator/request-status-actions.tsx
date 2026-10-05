"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Action = "start" | "deliver" | "close" | "cancel";

const allowedActions: Record<string, Action[]> = {
  quote_approved: ["start", "cancel"],
  in_progress: ["deliver", "cancel"],
  delivered: ["close", "cancel"],
};

export function RequestStatusActions({
  requestId,
  status,
  locale,
}: {
  requestId: string;
  status: string;
  locale: "fa" | "en";
}) {
  const fa = locale === "fa";
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState("");
  const actions = allowedActions[status] ?? [];
  if (!actions.length) return null;

  const labels: Record<Action, string> = fa
    ? { start: "شروع کار", deliver: "تحویل به مشتری", close: "تکمیل و تسویه", cancel: "لغو درخواست" }
    : { start: "Start work", deliver: "Mark delivered", close: "Complete & settle", cancel: "Cancel request" };

  async function update(action: Action) {
    if (action === "cancel") {
      const confirmed = window.confirm(
        fa
          ? "درخواست لغو شود؟ مبلغ رزروشده آزاد می‌شود؛ پرداخت انجام‌شده نیاز به بازپرداخت جداگانه دارد."
          : "Cancel this request? Held funds will be released; completed payments require a separate refund.",
      );
      if (!confirmed) return;
    }
    setBusy(action);
    setError("");
    try {
      const response = await fetch("/api/requests/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "request_failed");
      window.location.reload();
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "request_failed";
      setError(
        code === "payment_required"
          ? (fa ? "تسویه ممکن نیست؛ صورتحساب هنوز پرداخت نشده است." : "Cannot settle: the invoice has not been paid.")
          : code === "refund_required"
            ? (fa ? "این درخواست پرداخت شده و باید از بخش بازپرداخت پیگیری شود." : "This request was paid; process it through refunds.")
            : (fa ? "تغییر وضعیت انجام نشد. دوباره تلاش کنید." : "Status update failed. Please retry."),
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            type="button"
            size="sm"
            variant={action === "cancel" ? "outline" : "primary"}
            loading={busy === action}
            disabled={busy !== null}
            onClick={() => void update(action)}
          >
            {labels[action]}
          </Button>
        ))}
      </div>
      {error ? <p role="alert" className="mt-2 text-xs font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
