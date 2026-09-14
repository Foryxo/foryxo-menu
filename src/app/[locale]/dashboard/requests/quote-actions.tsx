"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function QuoteActions({ quoteId, locale }: { quoteId: string; locale: "fa" | "en" }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fa = locale === "fa";

  async function respond(action: "approve" | "reject") {
    setBusy(action);
    setError(null);
    try {
      const response = await fetch("/api/quotes/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, action }),
      });
      const data = (await response.json().catch(() => ({}))) as { paymentRequired?: boolean };
      if (!response.ok) throw new Error("request_failed");
      if (data.paymentRequired) {
        router.push(`/${locale}/dashboard/invoices`);
      } else {
        router.refresh();
      }
    } catch {
      setError(fa ? "ثبت پاسخ انجام نشد. دوباره تلاش کنید." : "Could not save your response. Please try again.");
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button size="sm" loading={busy === "approve"} disabled={Boolean(busy)} onClick={() => void respond("approve")}>
        {fa ? "تأیید هزینه" : "Approve quote"}
      </Button>
      <Button size="sm" variant="outline" loading={busy === "reject"} disabled={Boolean(busy)} onClick={() => void respond("reject")}>
        {fa ? "رد استعلام" : "Reject quote"}
      </Button>
      <span className="text-xs text-muted">
        {fa ? "در صورت کافی بودن اعتبار، مبلغ رزرو می‌شود؛ در غیر این صورت فاکتور ساخته می‌شود." : "Available credit is reserved; otherwise an invoice is created."}
      </span>
      {error ? <p className="w-full text-sm text-red-600 dark:text-red-400" role="alert">{error}</p> : null}
    </div>
  );
}
