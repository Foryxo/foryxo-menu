/**
 * Demo definitions. Each demo is a complete, independent visual architecture —
 * not a color variant. Content here is DEMO data, clearly labelled in UI.
 */
import type { Locale } from "@/domains/i18n/config";

export interface DemoProduct {
  slug: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  price: number; // Toman
  priceOld?: number;
  badges?: string[]; // bestseller | new | spicy | chef | vegetarian | vegan
  nutrition?: { kcal: number; protein: number; carbs: number; fat: number };
  allergens?: string[];
  dietary?: string[];
  allowsCustomRequest?: boolean;
  imagePrompt: string;
  /** Optional prebuilt asset path. Defaults to the demo/category/product convention. */
  imageUrl?: string;
  imageThumbnailUrl?: string;
  imageAspect?: "4:3" | "1:1" | "16:9" | "3:4";
  modifiers?: {
    slug: string;
    name: Record<Locale, string>;
    min: number;
    max: number;
    required?: boolean;
    options: { slug: string; name: Record<Locale, string>; delta: number; default?: boolean }[];
  }[];
}

export interface DemoCategory {
  slug: string;
  name: Record<Locale, string>;
  description?: Record<Locale, string>;
  icon?: string;
  daypart?: { start: string; end: string };
  products: DemoProduct[];
}

export interface DemoThemeTokens {
  bg: string;
  card: string;
  fg: string;
  muted: string;
  line: string;
  accent: string;
  accentFg: string;
  darkBg?: string;
  darkCard?: string;
  darkFg?: string;
  darkMuted?: string;
  darkLine?: string;
  darkAccent?: string;
  fontFeel?: "modern" | "classic" | "warm" | "bold";
  radius?: string;
}

export interface DemoMeta {
  id: string; // mora | volt | ...
  name: string;
  nameFa: string;
  tagline: Record<Locale, string>;
  bestFor: Record<Locale, string[]>;
  characteristics: Record<Locale, string[]>;
  supportedFeatures: string[]; // feature keys from content/features.ts
  colorMode: "light" | "dark" | "system";
}

export interface DemoDefinition extends DemoMeta {
  theme: DemoThemeTokens;
  categories: DemoCategory[];
}

/** Photo style fragments per demo to differentiate generated prompts. */
export function prompt(
  item: string,
  plating: string,
  lighting: string,
  background: string,
  aspect = "4:3",
): string {
  return `Photorealistic commercial food photography of ${item}, authentic ingredients and realistic portion size, ${plating}, ${lighting}, ${background}, natural food texture, no text, no watermark, no logo, no hands unless specified, believable restaurant photography, suitable for a premium digital menu, ${aspect} aspect ratio.`;
}
