import type { BuilderConfig } from "./config";

export interface DeliveryAdjustment {
  key: string;
  businessDays: number;
}

export interface DeliveryEstimate {
  minimumBusinessDays: number;
  maximumBusinessDays: number;
  adjustments: DeliveryAdjustment[];
}

/** Planning estimate, not a promised deadline. The final date belongs in the approved quote. */
export function calculateDeliveryEstimate(config: Partial<BuilderConfig>): DeliveryEstimate {
  const adjustments: DeliveryAdjustment[] = [];
  const add = (key: string, days: number) => {
    if (days > 0) adjustments.push({ key, businessDays: days });
  };
  const features = new Set(config.features ?? []);

  if (config.businessType === "foodhall") add("business.foodhall", 2);
  if (config.demoId === "custom" || features.has("custom_design")) add("design.custom", 5);
  if (config.languages?.includes("en")) add("language.english", 2);
  if (config.languages?.includes("other")) {
    add("language.additional", 3 * Math.max(1, Math.min(8, config.additionalLanguageCount ?? 1)));
  }

  const featureDays: Record<string, number> = {
    favorites: 1, consumer_profiles: 2, cart: 1, whatsapp_order: 1,
    telegram_order: 1, call_waiter: 1, discounts: 1, scheduled_menu: 1,
    analytics_lite: 1, analytics_pro: 2, pwa: 1, admin_lite: 2,
    modifiers: 2, upsell: 1, direct_order: 5, payment_gateway: 3,
  };
  for (const feature of features) add(`feature.${feature}`, featureDays[feature] ?? 0);

  if (features.has("table_qr")) {
    add("feature.table_qr", Math.ceil(Math.max(1, config.qrTableCount ?? 1) / 50));
  }
  if (features.has("multiple_branches")) {
    const extraBranches = Math.max(1, Math.min(49, (config.branchCount ?? 2) - 1));
    add("feature.multiple_branches", extraBranches * (config.branchMenuMode === "shared" ? 1 : 2));
  }

  switch (config.contentOption) {
    case "spreadsheet": add("content.spreadsheet", 1); break;
    case "pdf": add("content.pdf", 2); break;
    case "photos": add("content.photos", Math.ceil(Math.max(1, config.photoCount ?? 1) / 10)); break;
    case "full_service": add("content.full_service", 2 * Math.ceil(Math.max(1, config.itemCount ?? 40) / 50)); break;
    default: break;
  }
  if (config.domainOption === "own" || config.domainOption === "help" || config.domainOption === "website" || features.has("custom_domain")) {
    add("domain.setup", 1);
  }
  if (config.management === "self") add("management.self", 1);

  const minimumBusinessDays = 7 + adjustments.reduce((sum, item) => sum + item.businessDays, 0);
  return {
    minimumBusinessDays,
    maximumBusinessDays: minimumBusinessDays + Math.max(2, Math.ceil(minimumBusinessDays * 0.2)),
    adjustments,
  };
}
