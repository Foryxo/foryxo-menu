"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RevokeSessionButton({ sessionId, label }: { sessionId: string; label: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/auth/sessions/revoke", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          window.location.reload();
        } finally {
          setBusy(false);
        }
      }}
    >
      {label}
    </Button>
  );
}
