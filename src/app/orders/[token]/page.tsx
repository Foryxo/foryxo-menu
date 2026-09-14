import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicOrderTracking } from "@/domains/ordering/tracking";
import { OrderTracker } from "./order-tracker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order tracking | Foryxo Menu", robots: { index: false, follow: false } };

export default async function OrderTrackingPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ lang?: string }> }) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  if (!/^[a-f0-9]{32,64}$/.test(token)) notFound();
  const order = await getPublicOrderTracking(token);
  if (!order) notFound();
  return <OrderTracker token={token} locale={query.lang === "en" ? "en" : "fa"} initialOrder={order} />;
}
