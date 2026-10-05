import type { Locale } from "@/domains/i18n/config";

export const LOCALE_STORAGE_KEY = "locale";
export const LOCALE_COOKIE_NAME = "foryxo_locale";

function isPreferredLocale(value: string | null | undefined): value is Locale {
  return value === "fa" || value === "en";
}

/** Cookie is authoritative because the server-side locale redirect reads it too. */
export function resolveLocalePreference(
  cookieHeader: string,
  storedLocale: string | null,
): Locale {
  const cookieLocale = cookieHeader
    .split(";")
    .map((part) => part.trim().split("=", 2))
    .find(([name]) => name === LOCALE_COOKIE_NAME)?.[1];

  if (isPreferredLocale(cookieLocale)) return cookieLocale;
  return isPreferredLocale(storedLocale) ? storedLocale : "fa";
}

export function localePreferenceCookie(locale: Locale): string {
  return `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
