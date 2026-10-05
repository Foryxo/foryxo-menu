"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  LOCALE_STORAGE_KEY,
  resolveLocalePreference,
} from "@/lib/locale-preference";

export function PagesRootRedirect() {
  useEffect(() => {
    let storedLocale: string | null = null;
    try {
      storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {}
    const locale = resolveLocalePreference(document.cookie, storedLocale);
    window.location.replace(
      `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${locale}${window.location.search}${window.location.hash}`,
    );
  }, []);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return (
    <main className="grid min-h-screen place-content-center justify-items-center gap-4 text-center">
      <p>در حال باز کردن فوریکسو… / Opening Foryxo Menu…</p>
      <div className="flex gap-5">
        <Link href={`${basePath}/fa`}>فارسی</Link>
        <Link href={`${basePath}/en`}>English</Link>
      </div>
    </main>
  );
}
