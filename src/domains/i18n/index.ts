import { defaultLocale, isLocale, type Locale } from "./config";
import { fa, type Dictionary } from "./dictionaries/fa";
import { en } from "./dictionaries/en";
export * from "./config";
export * from "./format";
export * from "./normalize";
export { buildAlternates } from "./seo-link";

const dictionaries: Record<Locale, Dictionary> = { fa, en };

export function getDictionary(locale: string | undefined): Dictionary {
  return isLocale(locale) ? dictionaries[locale] : dictionaries[defaultLocale];
}

export type { Dictionary, Locale };
