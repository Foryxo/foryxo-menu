"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { toAsciiDigits } from "@/domains/i18n/normalize";
import type { Locale } from "@/domains/i18n/config";

interface Labels {
  topup: string; topupAmount: string; addCredit: string;
  requestRefund: string; refundAmount: string; submitRequest: string;
  refundNote: string; toman: string; error: string;
}

const TOPUP_PRESETS = [500_000, 1_000_000, 2_000_000, 5_000_000];

export function WalletActions({
  businessId, locale, labels: L,
}: {
  businessId: string; locale: Locale; labels: Labels;
}) {
  const [topupAmount, setTopupAmount] = useState<number>(1_000_000);
  const [refundAmount, setRefundAmount] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startTopup() {
    setBusy("topup");
    setError(null);
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, amount: topupAmount }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError(L.error);
      }
    } catch {
      setError(L.error);
    } finally {
      setBusy(null);
    }
  }

  async function requestRefund() {
    setBusy("refund");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/wallet/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, amount: Number(toAsciiDigits(refundAmount).replace(/\D/g, "")) }),
      });
      if (res.ok) {
        setMessage(L.submitRequest);
        setRefundAmount("");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "insufficient" ? L.error : L.error);
      }
    } catch {
      setError(L.error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="surface rounded-2xl p-5">
        <h3 className="font-extrabold">{L.topup}</h3>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {TOPUP_PRESETS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setTopupAmount(a)}
              className={`rounded-lg border px-2 py-2 text-xs font-bold ${topupAmount === a ? "border-[var(--accent)] accent-soft-bg accent-text" : "border-line hover:bg-subtle"}`}
            >
              {(a / 1_000_000).toLocaleString(locale === "fa" ? "fa-IR" : "en-US")}M
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            min={100000}
            step={100000}
            value={topupAmount}
            onChange={(e) => setTopupAmount(Number(e.target.value))}
            aria-label={L.topupAmount}
          />
          <span className="shrink-0 text-sm text-muted">{L.toman}</span>
        </div>
        <Button className="mt-3 w-full" loading={busy === "topup"} onClick={startTopup}>
          {L.addCredit}
        </Button>
      </div>

      <div className="surface rounded-2xl p-5">
        <h3 className="font-extrabold">{L.requestRefund}</h3>
        <p className="mt-1 text-xs leading-5 text-muted">{L.refundNote}</p>
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            aria-label={L.refundAmount}
          />
          <span className="shrink-0 text-sm text-muted">{L.toman}</span>
        </div>
        <Button variant="secondary" className="mt-3 w-full" loading={busy === "refund"} onClick={requestRefund} disabled={!refundAmount}>
          {L.submitRequest}
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400 md:col-span-2" role="alert">{error}</p> : null}
      {message ? <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 md:col-span-2" role="status">{message}</p> : null}
    </div>
  );
}
