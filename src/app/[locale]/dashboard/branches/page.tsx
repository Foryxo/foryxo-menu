import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { requireUser } from "@/domains/auth/guards";
import { getDashboardBranches } from "@/domains/dashboard/data";
import { isLocale } from "@/domains/i18n/config";
import { BranchManager } from "./branch-manager";

export default async function BranchesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const session = await requireUser(`/${l}/dashboard/branches`);
  const data = await getDashboardBranches(session.user.id);
  if (!data) return <EmptyState icon={<Building2 />} title={l === "fa" ? "دسترسی مدیریت شعبه برای این حساب فعال نیست." : "This account does not have branch-management access."} />;
  return <BranchManager locale={l} businessId={data.business.id} initialBranches={data.branches.map((branch) => ({ id: branch.id, name: branch.name, address: branch.address ?? "", city: branch.city ?? "", province: branch.province ?? "", phone: branch.phone ?? "", mapUrl: branch.mapUrl ?? "", isPrimary: branch.isPrimary, isActive: branch.isActive, acceptsOrders: branch.acceptsOrders, fulfillmentTypes: Array.isArray(branch.fulfillmentTypes) ? branch.fulfillmentTypes as string[] : [], minimumOrder: branch.minimumOrder, orderContactPhone: branch.orderContactPhone ?? "", notificationEmail: branch.notificationEmail ?? "", createdAt: branch.createdAt.toISOString(), updatedAt: branch.updatedAt.toISOString() }))} />;
}
