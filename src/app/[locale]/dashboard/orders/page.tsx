import { ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { requireUser } from "@/domains/auth/guards";
import { getDashboardOrders } from "@/domains/dashboard/data";
import { isLocale } from "@/domains/i18n/config";
import { OrderInbox } from "./order-inbox";

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const session = await requireUser(`/${l}/dashboard/orders`);
  const data = await getDashboardOrders(session.user.id);
  if (!data) return <EmptyState icon={<ShoppingBag />} title={l === "fa" ? "دسترسی مشاهده سفارش برای این حساب فعال نیست." : "This account does not have order access."} />;
  return <OrderInbox locale={l} initialOrders={data.orders.map(({ order, branch, business }) => ({ ...order, createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString(), branchName: branch?.name ?? null, businessName: business.name, items: data.items.filter((item) => item.orderId === order.id) }))} />;
}
