import { requireAdmin } from "@/domains/auth/guards";
import { getCreatorQrBranches, getCreatorQrMenus } from "@/domains/creator/data";
import { isLocale } from "@/domains/i18n/config";
import { QrManager } from "../../creator/qr/qr-manager";

export default async function AdminQrPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  await requireAdmin(`/${l}/admin/qr`, ["superadmin", "admin", "editor"]);
  const [rows, branchRows] = await Promise.all([getCreatorQrMenus(), getCreatorQrBranches()]);
  return <QrManager locale={l} menus={rows.map(({ menu, business }) => ({ id: menu.id, slug: menu.slug, title: menu.title, businessId: menu.businessId, branchId: menu.branchId, businessName: business.name, status: menu.status }))} branches={branchRows.map((branch) => ({ id: branch.id, businessId: branch.businessId, name: branch.name, isPrimary: branch.isPrimary, isActive: branch.isActive }))} />;
}
