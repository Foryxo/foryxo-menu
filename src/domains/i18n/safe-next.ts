import type { Locale } from "@/domains/i18n/config";

/** Keep post-login navigation inside the app and in the selected language. */
export function localizedSafeNext(value: string | null | undefined, locale: Locale): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  try {
    const url = new URL(value, "https://menu.foryxo.com");
    if (url.origin !== "https://menu.foryxo.com" || !/^\/(fa|en)(?=\/|$)/.test(url.pathname)) return null;
    return `${url.pathname.replace(/^\/(fa|en)(?=\/|$)/, `/${locale}`)}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
