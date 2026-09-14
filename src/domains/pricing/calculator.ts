/**
 * Pricing calculator — data-driven from price_catalog (spec §35).
 * The catalog rows below mirror the DB seed and are used for pure
 * calculation in tests/worker contexts; the DB is authoritative at runtime.
 */
export interface BuilderConfig {
  demoId: string;
  businessType: string;
  languages: string[]; // fa | en | other
  additionalLanguageCount?: number;
  features: string[];
  contentOption: string; // manual | spreadsheet | pdf | photos | later | full_service
  domainOption: string; // own | help | none | website
  management: string; // self | managed | hybrid
  itemCount?: number;
  photoCount?: number;
  qrTableCount?: number;
  branchCount?: number;
  branchMenuMode?: "shared" | "unique" | "mixed";
}

export interface CatalogPrice {
  key: string;
  default: number;
  min?: number;
  max?: number;
  recurring?: boolean;
  unit?: "fixed" | "per_table";
}

/** Mirrors scripts/seed pricing (spec §35). Keep in sync via seed. */
export const CATALOG: CatalogPrice[] = [
  { key: "package.basic", default: 1_800_000 },
  { key: "package.plus", default: 3_000_000 },
  { key: "package.pro", default: 5_500_000 },
  { key: "package.business", default: 8_000_000, min: 8_000_000 },
  { key: "package.custom", default: 3_800_000, min: 3_800_000, max: 5_000_000 },
  { key: "addon.english", default: 1_000_000 },
  { key: "addon.language", default: 800_000 },
  { key: "addon.admin_lite", default: 2_000_000 },
  { key: "addon.admin_full", default: 3_000_000 },
  { key: "addon.search", default: 300_000 },
  { key: "addon.favorites", default: 400_000 },
  { key: "addon.cart", default: 700_000 },
  { key: "addon.whatsapp", default: 700_000 },
  { key: "addon.telegram", default: 700_000 },
  {
    key: "addon.ordering_full",
    default: 2_000_000,
    min: 2_000_000,
    max: 3_500_000,
  },
  {
    key: "addon.payment_gateway",
    default: 2_000_000,
    min: 2_000_000,
    max: 3_000_000,
  },
  // Per-table permanent QR. 20 tables retain the previous 800,000 Toman package value.
  { key: "addon.table_qr", default: 40_000, unit: "per_table" },
  { key: "addon.call_waiter", default: 700_000, min: 700_000, max: 1_000_000 },
  { key: "addon.branch", default: 1_500_000 },
  { key: "addon.branch_unique_menu", default: 1_000_000 },
  { key: "addon.discounts", default: 700_000 },
  { key: "addon.hours_automation", default: 300_000 },
  { key: "addon.pwa", default: 700_000 },
  { key: "addon.analytics_lite", default: 1_000_000 },
  {
    key: "addon.analytics_pro",
    default: 1_500_000,
    min: 1_500_000,
    max: 2_000_000,
  },
  { key: "addon.domain_setup", default: 300_000, min: 300_000, max: 500_000 },
  { key: "content.entry_50", default: 500_000 },
  { key: "content.entry_extra_50", default: 500_000 },
  { key: "content.image_cleanup", default: 20_000, min: 20_000, max: 50_000 },
  { key: "hosting.basic", default: 600_000, recurring: true },
  { key: "hosting.support", default: 900_000, recurring: true },
  { key: "hosting.managed", default: 1_500_000, recurring: true },
  { key: "support.urgent", default: 500_000 },
];

export function catalogPrice(key: string): CatalogPrice {
  const found = CATALOG.find((c) => c.key === key);
  if (!found) throw new Error(`Unknown price key: ${key}`);
  return found;
}

export interface EstimateLine {
  key: string | null;
  label: string; // catalog label resolved by caller or fallback
  amount: number;
  recurring: boolean;
  note?: string;
}

export interface Estimate {
  lines: EstimateLine[];
  initialTotal: number;
  recurringAnnual: number;
}

const FEATURE_PRICE_KEYS: Record<string, string> = {
  favorites: "addon.favorites",
  consumer_profiles: "addon.favorites",
  cart: "addon.cart",
  modifiers: "addon.cart",
  whatsapp_order: "addon.whatsapp",
  telegram_order: "addon.telegram",
  direct_order: "addon.ordering_full",
  payment_gateway: "addon.payment_gateway",
  table_qr: "addon.table_qr",
  call_waiter: "addon.call_waiter",
  multiple_branches: "addon.branch",
  discounts: "addon.discounts",
  upsell: "addon.discounts",
  scheduled_menu: "addon.hours_automation",
  analytics_lite: "addon.analytics_lite",
  analytics_pro: "addon.analytics_pro",
  pwa: "addon.pwa",
  admin_lite: "addon.admin_lite",
};

/** Features included with every design (no charge). */
const INCLUDED = new Set([
  "search",
  "nutrition",
  "dietary_filters",
  "custom_request",
  "loyalty_ready",
  "reservation_link",
  "managed_editing",
]);

function packageFor(config: BuilderConfig): { key: string; reason: string } {
  const f = new Set(config.features);
  if (
    f.has("direct_order") ||
    f.has("payment_gateway") ||
    f.has("multiple_branches")
  ) {
    return { key: "package.business", reason: "ordering" };
  }
  if (config.management === "self" || f.has("admin_lite")) {
    return { key: "package.pro", reason: "self-managed" };
  }
  return { key: "package.basic", reason: "base menu" };
}

/**
 * Pure estimate calculation. No side effects; DB catalog overrides at runtime.
 */
export function calculateEstimate(config: BuilderConfig): Estimate {
  const lines: EstimateLine[] = [];

  const pkg = packageFor(config);
  const pkgPrice = catalogPrice(pkg.key);
  lines.push({
    key: pkg.key,
    label: pkg.key,
    amount: pkgPrice.default,
    recurring: false,
    note: pkg.reason,
  });

  // Languages: en beyond the package
  if (config.languages.includes("en")) {
    lines.push({
      key: "addon.english",
      label: "addon.english",
      amount: catalogPrice("addon.english").default,
      recurring: false,
    });
  }
  const explicitAdditional = config.languages.filter(
    (l) => l !== "fa" && l !== "en" && l !== "other",
  ).length;
  const selectedAdditional = config.languages.includes("other")
    ? Math.max(1, Math.min(8, config.additionalLanguageCount ?? 1))
    : 0;
  const otherLangs = explicitAdditional + selectedAdditional;
  for (let i = 0; i < otherLangs; i++) {
    lines.push({
      key: "addon.language",
      label: "addon.language",
      amount: catalogPrice("addon.language").default,
      recurring: false,
    });
  }

  // Features
  const seen = new Set<string>();
  for (const f of config.features) {
    if (INCLUDED.has(f)) continue;
    const priceKey = FEATURE_PRICE_KEYS[f];
    if (!priceKey || seen.has(priceKey)) continue;
    // ordering_full covers cart/modifiers; business package covers ordering_full & payment gateway
    if (
      pkg.key === "package.business" &&
      (priceKey === "addon.ordering_full" ||
        priceKey === "addon.payment_gateway" ||
        priceKey === "addon.cart")
    )
      continue;
    seen.add(priceKey);
    const quantity =
      priceKey === "addon.table_qr"
        ? Math.max(1, Math.min(500, config.qrTableCount ?? 1))
        : priceKey === "addon.branch"
          ? Math.max(1, Math.min(49, (config.branchCount ?? 2) - 1))
        : 1;
    lines.push({
      key: priceKey,
      label: priceKey,
      amount: catalogPrice(priceKey).default * quantity,
      recurring: false,
      ...(priceKey === "addon.table_qr" ? { note: `${quantity} tables` } : {}),
      ...(priceKey === "addon.branch" ? { note: `${quantity} additional branches` } : {}),
    });
  }

  if (config.demoId === "custom" || config.features.includes("custom_design")) {
    lines.push({
      key: "package.custom",
      label: "package.custom",
      amount: catalogPrice("package.custom").default - catalogPrice("package.basic").default,
      recurring: false,
      note: "custom design uplift beyond the base design",
    });
  }

  if (config.features.includes("multiple_branches") && config.branchMenuMode !== "shared") {
    const uniqueMenus = Math.max(1, Math.min(49, (config.branchCount ?? 2) - 1));
    lines.push({
      key: "addon.branch_unique_menu",
      label: "addon.branch_unique_menu",
      amount: catalogPrice("addon.branch_unique_menu").default * uniqueMenus,
      recurring: false,
      note: `${uniqueMenus} branch menu variants`,
    });
  }

  // Content entry volume
  if (config.contentOption === "full_service") {
    const count = Math.max(config.itemCount ?? 40, 10);
    const base = catalogPrice("content.entry_50");
    const extraBlocks = Math.max(0, Math.ceil((count - 50) / 50));
    lines.push({
      key: "content.entry_50",
      label: "content.entry_50",
      amount: base.default,
      recurring: false,
      note: `${count} items`,
    });
    for (let i = 0; i < extraBlocks; i++) {
      lines.push({
        key: "content.entry_extra_50",
        label: "content.entry_extra_50",
        amount: catalogPrice("content.entry_extra_50").default,
        recurring: false,
      });
    }
  }
  if (config.photoCount && config.photoCount > 0) {
    const per = catalogPrice("content.image_cleanup");
    lines.push({
      key: "content.image_cleanup",
      label: "content.image_cleanup",
      amount: per.default * config.photoCount,
      recurring: false,
      note: `${config.photoCount} images`,
    });
  }

  // Domain setup
  if (config.domainOption === "own" || config.domainOption === "website" || config.domainOption === "help" || config.features.includes("custom_domain")) {
    lines.push({
      key: "addon.domain_setup",
      label: "addon.domain_setup",
      amount: catalogPrice("addon.domain_setup").default,
      recurring: false,
    });
  }

  // Hosting tier (recurring)
  const recurringTier =
    config.management === "managed"
      ? "hosting.managed"
      : config.management === "self"
        ? "hosting.support"
        : "hosting.basic";
  lines.push({
    key: recurringTier,
    label: recurringTier,
    amount: catalogPrice(recurringTier).default,
    recurring: true,
  });

  const initialTotal = lines
    .filter((l) => !l.recurring)
    .reduce((s, l) => s + l.amount, 0);
  const recurringAnnual = lines
    .filter((l) => l.recurring)
    .reduce((s, l) => s + l.amount, 0);

  return { lines, initialTotal, recurringAnnual };
}
