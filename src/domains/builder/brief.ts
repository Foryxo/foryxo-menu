import { builderConfigSchema, type BuilderConfig } from "@/domains/builder/config";
import { calculateDeliveryEstimate } from "@/domains/builder/delivery";

type EstimateLine = {
  key?: string | null;
  label?: string;
  amount?: number;
  recurring?: boolean;
  note?: string;
};

export type SubmissionSnapshot = BuilderConfig & {
  estimateAtSubmission?: {
    lines?: EstimateLine[];
    initialTotal?: number;
    recurringAnnual?: number;
  };
  [key: string]: unknown;
};

export type BriefAsset = {
  mediaId: string;
  downloadUrl: string;
  filename: string;
  kind: string;
  dishOrAssetName: string | null;
  customerInstructions: string | null;
  workflowStatus: string;
  mime: string;
  size: number;
};

/**
 * Convert an immutable builder snapshot into a stable, implementation-oriented
 * handoff. `completeSubmittedSnapshot` deliberately retains unknown future
 * fields so a new builder option can never disappear from creator handoff.
 */
export function makeImplementationBrief(input: {
  projectId: string;
  submittedAt: Date;
  status: string;
  business: { id: string; name: string; nameEn: string | null; slug: string; businessType: string };
  owner: { name?: string | null; email?: string | null; phone?: string | null } | null;
  configuration: unknown;
  assets: BriefAsset[];
}) {
  const raw = input.configuration && typeof input.configuration === "object"
    ? input.configuration as Record<string, unknown>
    : {};
  const parsed = builderConfigSchema.safeParse(raw);
  const config = parsed.success ? parsed.data : null;
  const estimate = raw.estimateAtSubmission && typeof raw.estimateAtSubmission === "object"
    ? raw.estimateAtSubmission as SubmissionSnapshot["estimateAtSubmission"]
    : undefined;

  return {
    schemaVersion: 1,
    purpose: "Foryxo Menu implementation handoff — treat this as the customer's submitted build specification.",
    project: {
      id: input.projectId,
      status: input.status,
      submittedAt: input.submittedAt.toISOString(),
    },
    customer: {
      name: input.owner?.name ?? null,
      email: input.owner?.email ?? null,
      phone: input.owner?.phone ?? null,
    },
    business: input.business,
    design: {
      sourceDemo: config?.demoId ?? raw.demoId ?? null,
      customDesignBrief: config?.customBrief ?? raw.customBrief ?? null,
      referenceUrls: config?.referenceUrls ?? raw.referenceUrls ?? null,
      brandNamePersian: config?.brandName ?? raw.brandName ?? input.business.name,
      brandNameEnglish: config?.brandNameEn ?? raw.brandNameEn ?? input.business.nameEn,
      primaryColor: config?.primaryColor ?? raw.primaryColor ?? null,
      secondaryColor: config?.secondaryColor ?? raw.secondaryColor ?? null,
      colorMode: config?.colorMode ?? raw.colorMode ?? null,
      fontFeel: config?.fontFeel ?? raw.fontFeel ?? null,
    },
    menuContent: {
      languages: config?.languages ?? raw.languages ?? [],
      additionalLanguageCount: config?.additionalLanguageCount ?? raw.additionalLanguageCount ?? 0,
      source: config?.contentOption ?? raw.contentOption ?? null,
      expectedItemCount: config?.itemCount ?? raw.itemCount ?? null,
      photosRequestedForEditing: config?.photoCount ?? raw.photoCount ?? 0,
    },
    functionality: {
      selectedFeatures: config?.features ?? raw.features ?? [],
      fulfillmentTypes: config?.fulfillmentTypes ?? raw.fulfillmentTypes ?? [],
      orderNotificationChannels: config?.orderNotificationChannels ?? raw.orderNotificationChannels ?? [],
      permanentTableQrQuantity: config?.qrTableCount ?? raw.qrTableCount ?? 0,
      managementMode: config?.management ?? raw.management ?? null,
    },
    branches: {
      totalLocations: config?.branchCount ?? raw.branchCount ?? 1,
      menuMode: config?.branchMenuMode ?? raw.branchMenuMode ?? "shared",
      customerSelectionMode: config?.branchSelectionMode ?? raw.branchSelectionMode ?? "customer",
    },
    hostingAndDomain: {
      option: config?.domainOption ?? raw.domainOption ?? null,
      requestedDomain: config?.domainName ?? raw.domainName ?? null,
      plannedMenuPath: `/menus/${input.business.slug}/menu`,
    },
    submittedEstimate: {
      currency: "IRT",
      initialTotal: estimate?.initialTotal ?? null,
      recurringAnnual: estimate?.recurringAnnual ?? null,
      lines: estimate?.lines ?? [],
      note: "Estimate captured at submission; creator/admin may issue the binding quote separately.",
    },
    deliveryPlanning: {
      ...(config ? calculateDeliveryEstimate(config) : {}),
      note: "Business-day planning estimate begins after complete content and quote approval; confirm the deadline with the customer in the approved quote.",
    },
    productionAssets: input.assets,
    completeSubmittedSnapshot: raw,
  };
}
