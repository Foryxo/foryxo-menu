/**
 * Locale-aware formatting.
 * MONEY: internal amounts are integer Toman (IRT). Display-only conversion.
 * See docs/wallet-service-credit.md — never infer Rial/Toman.
 */
import type { Locale } from "./config";
import { toPersianDigits } from "./normalize";

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(value);
}

export function formatToman(amount: number, locale: Locale): string {
  if (locale === "fa") {
    return `${toPersianDigits(new Intl.NumberFormat("en-US").format(amount))} تومان`;
  }
  return `${new Intl.NumberFormat("en-US").format(amount)} Toman`;
}

/** Compact Toman for cards: ۱٫۲ میلیون تومان / 1.2M Toman */
export function formatTomanCompact(amount: number, locale: Locale): string {
  if (amount >= 1_000_000) {
    const m = Math.round((amount / 1_000_000) * 10) / 10;
    return locale === "fa"
      ? `${toPersianDigits(m)} میلیون تومان`
      : `${m}M Toman`;
  }
  return formatToman(amount, locale);
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR-u-ca-persian" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR-u-ca-persian" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatPercent(p: number, locale: Locale): string {
  const v = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(p);
  return locale === "fa" ? `${toPersianDigits(v)}٪` : `${v}%`;
}
