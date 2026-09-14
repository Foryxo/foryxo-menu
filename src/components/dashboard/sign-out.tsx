"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/domains/auth/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({ locale, label, compact }: { locale: "fa" | "en"; label: string; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size={compact ? "sm" : "md"}
      className={compact ? "" : "mt-2 w-full justify-start"}
      loading={busy}
      onClick={async () => {
        setBusy(true);
        await authClient.signOut();
        router.push(`/${locale}`);
        router.refresh();
      }}
    >
      {label}
    </Button>
  );
}
