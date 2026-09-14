import { requireCreator } from "@/domains/auth/guards";
import { getCreatorOrders } from "@/domains/creator/data";
import { isLocale } from "@/domains/i18n/config";
import { OrderInbox } from "../../dashboard/orders/order-inbox";

export default async function CreatorOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  await requireCreator(`/${l}/creator/orders`);
  const data = await getCreatorOrders();
  return <OrderInbox locale={l} initialOrders={data.rows.map(({ order, branch, business }) => ({ ...order, createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString(), branchName: branch?.name ?? null, businessName: business.name, items: data.items.filter((item) => item.orderId === order.id) }))} />;
}
