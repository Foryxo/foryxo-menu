export type EdgeCountrySource = "cloudflare" | "vercel" | null;

export type RequestGeography = {
  countryCode: string | null;
  isIran: boolean;
  source: EdgeCountrySource;
};

/** Normalize an ISO 3166-1 alpha-2 country code supplied by a trusted edge. */
export function normalizeCountryCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase();
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

/** Normalize the ISO 639-1 language portion of a locale. */
export function normalizeLanguageCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().split(/[-_]/, 1)[0]?.toLowerCase();
  return normalized && /^[a-z]{2}$/.test(normalized) ? normalized : null;
}

/**
 * Resolve request geography from headers set by our deployment edge.
 * Never accept a country value from form input for access-control decisions.
 */
export function getRequestGeography(headers: Pick<Headers, "get">): RequestGeography {
  const cloudflareCountry = normalizeCountryCode(headers.get("cf-ipcountry"));
  if (cloudflareCountry) {
    return {
      countryCode: cloudflareCountry,
      isIran: cloudflareCountry === "IR",
      source: "cloudflare",
    };
  }

  const vercelCountry = normalizeCountryCode(headers.get("x-vercel-ip-country"));
  return {
    countryCode: vercelCountry,
    isIran: vercelCountry === "IR",
    source: vercelCountry ? "vercel" : null,
  };
}

export function getLocalizedCountryName(countryCode: string, locale: string): string {
  const normalizedCountry = normalizeCountryCode(countryCode);
  const normalizedLanguage = normalizeLanguageCode(locale) ?? "en";
  if (!normalizedCountry) return countryCode;

  try {
    return new Intl.DisplayNames([normalizedLanguage], { type: "region" }).of(normalizedCountry) ?? normalizedCountry;
  } catch {
    return normalizedCountry;
  }
}

/** Optional reference data when a future LinkedIn integration returns a Bing Geo URN. */
export type LinkedInGeoReference = {
  id: string;
  defaultLocalizedName?: {
    locale: { language: string; country: string };
    value: string;
  };
};
