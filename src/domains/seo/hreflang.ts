/**
 * Canonical/hreflang helpers (spec §44, §124).
 * Every locale canonicalizes to itself; hreflang pairs both locales;
 * x-default points to the default locale (fa).
 */
import type { Locale } from "@/domains/i18n/config";

export const SITE_URL = process.env.APP_URL ?? "https://menu.foryxo.com";

function absolute(locale: Locale, path: string): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}/${locale}${clean}`;
}

export function buildAlternates(path: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  // Legacy 2-arg-tolerant signature: canonical = fa (default locale).
  return {
    canonical: absolute("fa", path),
    languages: {
      fa: absolute("fa", path),
      en: absolute("en", path),
      "x-default": absolute("fa", path),
    },
  };
}

/** Per-locale canonical + hreflang set. Preferred for page metadata. */
export function alternatesFor(locale: Locale, path: string) {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return {
    canonical: absolute(locale, clean),
    languages: {
      fa: absolute("fa", clean),
      en: absolute("en", clean),
      "x-default": absolute("fa", clean),
    },
  };
}

export function localeHref(locale: Locale, path: string): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}
