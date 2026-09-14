"use client";

/**
 * Interactive demo phone — a live miniature of the actual demo menu
 * rendered from the demo definition (not a static screenshot).
 */
import { useState } from "react";
import Image from "next/image";
import type { DemoDefinition } from "@/content/demos/types";
import { formatToman } from "@/domains/i18n/format";
import { toPersianDigits } from "@/domains/i18n/normalize";
import type { Locale } from "@/domains/i18n/config";
import { ensureTextContrast, readableOn } from "@/lib/color-contrast";

export function DemoPhone({
  demo,
  locale,
  interactive = true,
}: {
  demo: DemoDefinition;
  locale: Locale;
  interactive?: boolean;
}) {
  const [catIdx, setCatIdx] = useState(0);
  const fa = locale === "fa";
  const theme = demo.theme;
  const muted = ensureTextContrast(theme.muted, [theme.bg, theme.card], theme.fg);
  const accentText = ensureTextContrast(theme.accent, [theme.bg, theme.card], theme.fg);
  const accentForeground = ensureTextContrast(theme.accentFg, theme.accent, readableOn(theme.accent));
  const cat = demo.categories[catIdx] ?? demo.categories[0];

  return (
    <div
      className="relative mx-auto aspect-[9/19] w-full max-w-[240px] overflow-hidden rounded-[2rem] border-[6px] border-neutral-900 shadow-[var(--shadow-pop)]"
      style={{ background: theme.bg }}
      aria-label={`${demo.name} ${fa ? "پیش‌نمایش منو" : "menu preview"}`}
    >
      {/* Notch */}
      <div className="absolute left-1/2 top-1 z-10 h-4 w-20 -translate-x-1/2 rounded-b-2xl bg-neutral-900" />

      {/* Mini header */}
      <div className="px-3 pb-2 pt-6">
        <div className="text-center">
          <div className="text-[11px] font-black" style={{ color: theme.fg }}>
            {fa ? demo.nameFa : demo.name}
          </div>
          <div className="mx-auto mt-1 h-0.5 w-8 rounded" style={{ background: theme.accent }} />
        </div>
        {/* Category chips */}
        <div className="mt-2 flex gap-1 overflow-hidden">
          {demo.categories.slice(0, 4).map((c, i) => {
            const className = "rounded-full px-2 py-0.5 text-[8px] font-bold whitespace-nowrap";
            const style = {
              background: i === catIdx ? theme.accent : theme.card,
              color: i === catIdx ? accentForeground : theme.fg,
              border: `1px solid ${theme.line}`,
            };
            const label = fa ? c.name.fa : c.name.en;
            return interactive
              ? <button key={c.slug} type="button" onClick={() => setCatIdx(i)} className={className} style={style}>{label}</button>
              : <span key={c.slug} className={className} style={style}>{label}</span>;
          })}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5 px-3 pb-4">
        {cat.products.slice(0, 5).map((p) => (
          <div
            key={p.slug}
            className="flex items-center gap-1.5 rounded-lg px-1.5 py-1.5"
            style={{ background: theme.card, border: `1px solid ${theme.line}`, borderRadius: theme.radius }}
          >
            <Image
              src={p.imageThumbnailUrl ?? p.imageUrl ?? `/images/demos/${demo.id}/${cat.slug}/${p.slug}-480.webp`}
              alt=""
              width={28}
              height={28}
              sizes="28px"
              className="size-7 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[9px] font-bold" style={{ color: theme.fg }}>
                  {fa ? p.name.fa : p.name.en}
                </span>
                <span className="shrink-0 text-[7px] font-extrabold" style={{ color: accentText }}>
                  {formatToman(p.price, locale)}
                </span>
              </div>
              <div className="truncate text-[7px]" style={{ color: muted }}>
                {fa ? p.description.fa : p.description.en}
              </div>
            </div>
          </div>
        ))}
        <div className="pt-1 text-center text-[7px]" style={{ color: muted }}>
          {fa ? `${toPersianDigits(demo.categories.length)} دسته` : `${demo.categories.length} categories`} · {demo.name}
        </div>
      </div>
    </div>
  );
}
