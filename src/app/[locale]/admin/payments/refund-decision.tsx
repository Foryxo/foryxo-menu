"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";

interface Labels {
  approve: string; reject: string; rejectReason: string; error: string;
}

export function RefundDecision({ refundId, labels: L }: { refundId: string; labels: Labels }) {
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(action: "approve" | "reject") {
    if (action === "reject" && reason.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundId, action, reason: action === "reject" ? reason.trim() : undefined }),
      });
      if (res.ok) {
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

  return (
    <div className="mt-3 space-y-2">
      {mode === "idle" ? (
        <div className="flex gap-2">
          <Button size="sm" loading={busy} onClick={() => decide("approve")}>
            {L.approve}
          </Button>
          <Button size="sm" variant="danger" onClick={() => setMode("reject")} disabled={busy}>
            {L.reject}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={L.rejectReason}
            className="max-w-xs"
            maxLength={200}
            required
          />
          <Button size="sm" variant="danger" loading={busy} onClick={() => decide("reject")} disabled={reason.trim().length < 3}>
            {L.reject}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode("idle")}>
            ×
          </Button>
        </div>
      )}
      {error ? <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p> : null}
    </div>
  );
}
