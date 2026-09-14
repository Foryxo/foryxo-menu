"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PayInvoiceButton({
  businessId, invoiceId, label, errorLabel,
}: {
  businessId: string; invoiceId: string; label: string; errorLabel: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function pay() {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/invoices/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, invoiceId }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button loading={busy} onClick={pay}>{label}</Button>
      {error ? <p className="text-xs text-red-600" role="alert">{errorLabel}</p> : null}
    </>
  );
}
