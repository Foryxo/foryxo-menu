"use client";

import Link from "next/link";
import { RotateCcw, Home } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";

export function ErrorState({ title, body, retry, locale = "fa", digest }: { title: string; body: string; retry?: () => void; locale?: "fa" | "en"; digest?: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-app px-4 py-12" dir={locale === "fa" ? "rtl" : "ltr"}>
      <section className="surface relative w-full max-w-lg overflow-hidden rounded-3xl p-8 text-center shadow-[var(--shadow-pop)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 accent-bg" />
        <BrandMark size={112} className="mx-auto drop-shadow-xl" priority />
        <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] accent-text">Foryxo Menu</p>
        <h1 className="mt-4 text-2xl font-black">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-muted">{body}</p>
        {digest ? <p className="mt-2 font-mono text-[10px] text-muted">{digest}</p> : null}
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {retry ? <button type="button" onClick={retry} className="inline-flex h-11 items-center gap-2 rounded-xl accent-bg px-5 text-sm font-bold"><RotateCcw className="size-4" aria-hidden="true" />{locale === "fa" ? "تلاش دوباره" : "Try again"}</button> : null}
          <Link href={`/${locale}`} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-elevated px-5 text-sm font-bold hover:bg-subtle"><Home className="size-4" aria-hidden="true" />{locale === "fa" ? "صفحه اصلی" : "Home"}</Link>
        </div>
      </section>
    </main>
  );
}
