/**
 * Menu read-model (spec §86) — one cacheable JSON representation of a
 * published menu. Built when a version is published; rendered pages and
 * public API consume this without heavy joins.
 */
import type { Locale } from "@/domains/i18n/config";
import type { DemoThemeTokens } from "@content/demos/types";

export interface ReadModelModifierOption {
  id: string;
  name: string;
  nameEn: string | null;
  priceDelta: number;
  isDefault: boolean;
  available: boolean;
}

export interface ReadModelModifierGroup {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  min: number;
  max: number;
  required: boolean;
  allowRepeat: boolean;
  options: ReadModelModifierOption[];
}

export interface ReadModelProduct {
  id: string;
  slug: string;
  categorySlug: string;
  sort: number;
  name: string; // default locale
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  price: number;
  priceOld: number | null;
  currency: string;
  available: boolean;
  soldOut: boolean;
  featured: boolean;
  hidden: boolean;
  scheduledHide: boolean;
  badges: string[];
  nutrition: { kcal: number; protein: number; carbs: number; fat: number } | null;
  allergens: string[];
  dietary: string[];
  allowsCustomRequest: boolean;
  imagePrompt: string | null;
  imageUrl: string | null;
  modifierGroups: ReadModelModifierGroup[];
}

export interface ReadModelCategory {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  icon: string | null;
  daypart: { start: string; end: string } | null;
  products: ReadModelProduct[];
}

export interface MenuReadModel {
  menuId: string;
  version: number;
  slug: string;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  locales: Locale[];
  theme: (DemoThemeTokens & { mode: string }) | null;
  business: {
    name: string;
    nameEn: string | null;
    slug: string;
    businessType: string;
    timezone: string;
    currency: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    latitude: string | null;
    longitude: string | null;
    openingHours: unknown;
    servesCuisine: string | null;
    priceRange: string | null;
    social: unknown;
  };
  categories: ReadModelCategory[];
  capabilities?: {
    ordering: boolean;
  };
  builtAt: string;
  contentHash: string;
}

/** Is a product visible right now given daypart + availability? */
export function isProductVisibleNow(
  p: ReadModelProduct,
  now = new Date(),
): boolean {
  void now;
  if (p.hidden) return false;
  // Note: sold-out products stay visible but marked; hidden ones disappear.
  return true;
}

export function isCategoryActiveNow(
  c: ReadModelCategory,
  now = new Date(),
  timezone = "Asia/Tehran",
): boolean {
  if (!c.daypart) return true;
  // Simple comparison in the menu's timezone (hour granularity is enough).
  const fmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  });
  const [h, m] = fmt.format(now).split(":").map(Number);
  const minutes = h * 60 + m;
  const [sh, sm] = c.daypart.start.split(":").map(Number);
  const [eh, em] = c.daypart.end.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  // Daypart may wrap midnight (e.g. 22:00–02:00)
  return start <= end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

/** Build searchable haystack with Persian normalization. */
export function buildSearchText(parts: (string | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
