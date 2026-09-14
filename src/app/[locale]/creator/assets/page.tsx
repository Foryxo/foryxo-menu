import { requireCreator } from "@/domains/auth/guards";
import { getCreatorFoodAssets } from "@/domains/creator/data";
import { isLocale } from "@/domains/i18n/config";
import { getStorage } from "@/domains/storage";
import { FoodAssetManager } from "./food-asset-manager";

export default async function CreatorAssetsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  await requireCreator(`/${l}/creator/assets`);
  const storage = getStorage();
  const rows = await getCreatorFoodAssets();

  return (
    <FoodAssetManager
      locale={l}
      initialAssets={rows.map(({ asset, business, uploader }) => ({
        id: asset.id,
        businessId: business.id,
        businessName: business.name,
        label: asset.label || asset.filename,
        filename: asset.filename,
        customerNotes: asset.customerNotes,
        creatorNotes: asset.creatorNotes,
        workflowStatus: asset.workflowStatus,
        mime: asset.mime,
        size: asset.size,
        url: storage.publicUrl(asset.storageKey),
        uploader: uploader?.email ?? null,
        createdAt: asset.createdAt.toISOString(),
      }))}
    />
  );
}
