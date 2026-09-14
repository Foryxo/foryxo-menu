export const locales = ["fa", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fa";

export function isLocale(v: string | undefined | null): v is Locale {
  return v === "fa" || v === "en";
}

export function dir(locale: Locale): "rtl" | "ltr" {
  return locale === "fa" ? "rtl" : "ltr";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "fa" ? "en" : "fa";
}

/** Locale-aware href with proper prefix. */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean === "/" ? "" : clean}`;
}
