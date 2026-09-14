import { requireCreator } from "@/domains/auth/guards";
import { isLocale } from "@/domains/i18n/config";
import { getCreatorQrBranches, getCreatorQrMenus } from "@/domains/creator/data";
import { QrManager } from "./qr-manager";

export default async function CreatorQrPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  await requireCreator();
  const [rows, branchRows] = await Promise.all([getCreatorQrMenus(), getCreatorQrBranches()]);
  return <QrManager locale={l} menus={rows.map(({ menu, business }) => ({ id: menu.id, slug: menu.slug, title: menu.title, businessId: menu.businessId, branchId: menu.branchId, businessName: business.name, status: menu.status }))} branches={branchRows.map((branch) => ({ id: branch.id, businessId: branch.businessId, name: branch.name, isPrimary: branch.isPrimary, isActive: branch.isActive }))} />;
}
