import { requireAdmin } from "@/domains/auth/guards";
import { getAdminBranches, getAdminBusinesses } from "@/domains/admin/data";
import { isLocale } from "@/domains/i18n/config";
import { AdminBranchesManager } from "./admin-branches-manager";

export default async function AdminBranchesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  await requireAdmin(`/${l}/admin/branches`, ["superadmin", "admin", "editor"]);
  const [businesses, rows] = await Promise.all([getAdminBusinesses(), getAdminBranches()]);
  const branches = rows.map((branch) => ({ id: branch.id, businessId: branch.businessId, name: branch.name, address: branch.address ?? "", city: branch.city ?? "", province: branch.province ?? "", phone: branch.phone ?? "", mapUrl: branch.mapUrl ?? "", isPrimary: branch.isPrimary, isActive: branch.isActive, acceptsOrders: branch.acceptsOrders, fulfillmentTypes: Array.isArray(branch.fulfillmentTypes) ? branch.fulfillmentTypes as string[] : [], minimumOrder: branch.minimumOrder, orderContactPhone: branch.orderContactPhone ?? "", notificationEmail: branch.notificationEmail ?? "", createdAt: branch.createdAt.toISOString(), updatedAt: branch.updatedAt.toISOString() }));
  return <AdminBranchesManager locale={l} businesses={businesses.map((business) => ({ id: business.id, name: business.name }))} branches={branches} />;
}
