/**
 * Builder configuration model (spec §24). Persisted per anonymous visitor /
 * user; attached to the project on submit. Immutable snapshot at submission.
 */
import { z } from "zod";

export const BUSINESS_TYPES = [
  "cafe", "restaurant", "cafe_restaurant", "fastfood",
  "iranian", "bakery", "brunch", "healthy", "foodhall", "other",
] as const;

export const MANAGEMENT_MODES = ["self", "managed", "hybrid"] as const;
export const CONTENT_OPTIONS = ["manual", "spreadsheet", "pdf", "photos", "later", "full_service"] as const;
export const DOMAIN_OPTIONS = ["own", "help", "none", "website"] as const;

export const builderConfigSchema = z.object({
  businessType: z.enum(BUSINESS_TYPES).nullish(),
  demoId: z.string().max(40).nullish(),
  customBrief: z.string().max(2000).nullish(),
  referenceUrls: z.string().max(1000).nullish(),
  brandName: z.string().max(80).nullish(),
  brandNameEn: z.string().max(80).nullish(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullish(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullish(),
  colorMode: z.enum(["system", "light", "dark"]).nullish(),
  fontFeel: z.enum(["modern", "classic", "warm", "bold"]).nullish(),
  languages: z.array(z.enum(["fa", "en", "other"])).default([]),
  additionalLanguageCount: z.number().int().min(0).max(8).default(0),
  features: z.array(z.string().max(40)).default([]),
  /** Number of table-specific permanent QR codes requested. The general menu QR is included. */
  qrTableCount: z.number().int().min(0).max(500).default(0),
  /** Total physical locations. One branch is included in every project. */
  branchCount: z.number().int().min(1).max(50).default(1),
  branchMenuMode: z.enum(["shared", "unique", "mixed"]).default("shared"),
  branchSelectionMode: z.enum(["customer", "nearest", "qr"]).default("customer"),
  fulfillmentTypes: z.array(z.enum(["dine_in", "takeaway", "delivery"])).default(["dine_in", "takeaway"]),
  orderNotificationChannels: z.array(z.enum(["dashboard", "browser", "email", "sms"])).default(["dashboard", "browser"]),
  contentOption: z.enum(CONTENT_OPTIONS).nullish(),
  itemCount: z.number().int().min(0).max(500).nullish(),
  photoCount: z.number().int().min(0).max(200).nullish(),
  domainOption: z.enum(DOMAIN_OPTIONS).nullish(),
  domainName: z.string().max(100).nullish(),
  management: z.enum(MANAGEMENT_MODES).nullish(),
});

export type BuilderConfig = z.infer<typeof builderConfigSchema>;

export const EMPTY_CONFIG: BuilderConfig = {
  businessType: null,
  demoId: null,
  customBrief: null,
  referenceUrls: null,
  brandName: null,
  brandNameEn: null,
  primaryColor: null,
  secondaryColor: null,
  colorMode: null,
  fontFeel: null,
  languages: [],
  additionalLanguageCount: 0,
  features: [],
  qrTableCount: 0,
  branchCount: 1,
  branchMenuMode: "shared",
  branchSelectionMode: "customer",
  fulfillmentTypes: ["dine_in", "takeaway"],
  orderNotificationChannels: ["dashboard", "browser"],
  contentOption: null,
  itemCount: null,
  photoCount: null,
  domainOption: null,
  domainName: null,
  management: null,
};

export const TOTAL_STEPS = 10;

/** The same completion rules apply in the browser and at submission time. */
export function invalidBuilderSteps(config: BuilderConfig): number[] {
  const invalid: number[] = [];
  if (!config.businessType) invalid.push(1);
  if (!config.demoId) invalid.push(2);
  if (!config.brandName?.trim() || (config.demoId === "custom" && !config.customBrief?.trim())) invalid.push(3);
  if (config.languages.length === 0) invalid.push(4);
  if (config.features.includes("direct_order") && config.fulfillmentTypes.length === 0) invalid.push(5);
  if (!config.contentOption || (config.contentOption === "photos" && !(config.photoCount && config.photoCount > 0)) || (config.contentOption === "full_service" && !(config.itemCount && config.itemCount > 0))) invalid.push(6);
  if (!config.domainOption || (config.domainOption === "own" && !config.domainName?.trim())) invalid.push(7);
  if (!config.management) invalid.push(8);
  return invalid;
}

export function mergeConfig(base: BuilderConfig, patch: Partial<BuilderConfig>): BuilderConfig {
  return builderConfigSchema.parse({ ...base, ...patch });
}
