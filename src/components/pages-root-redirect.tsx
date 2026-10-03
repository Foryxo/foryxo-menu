"use client";

import { useEffect } from "react";
import Link from "next/link";

export function PagesRootRedirect() {
  useEffect(() => {
    let locale = "fa";
    try {
      locale = localStorage.getItem("locale") === "en" ? "en" : "fa";
    } catch {}
    window.location.replace(
      `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${locale}`,
    );
  }, []);
  return (
    <main className="grid min-h-screen place-content-center justify-items-center gap-4 text-center">
      <p>در حال باز کردن فوریکسو… / Opening Foryxo Menu…</p>
      <div className="flex gap-5">
        <Link href="/fa">فارسی</Link>
        <Link href="/en">English</Link>
      </div>
    </main>
  );
}
