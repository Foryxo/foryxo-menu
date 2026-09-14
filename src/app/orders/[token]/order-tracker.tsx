"use client";

import { useEffect, useState } from "react";
import { Check, ChefHat, Clock, Phone, RefreshCw, X } from "lucide-react";
import type { PublicOrderTracking } from "@/domains/ordering/tracking";

const activeSteps = ["awaiting_confirmation", "accepted", "preparing", "ready", "completed"];

export function OrderTracker({ token, locale, initialOrder }: { token: string; locale: "fa" | "en"; initialOrder: PublicOrderTracking }) {
  const fa = locale === "fa";
  const [order, setOrder] = useState(initialOrder);
  const [refreshing, setRefreshing] = useState(false);
  const statusLabel = ({ awaiting_confirmation: fa ? "منتظر تأیید شعبه" : "Awaiting branch confirmation", accepted: fa ? "پذیرفته شد" : "Accepted", preparing: fa ? "در حال آماده‌سازی" : "Preparing", ready: fa ? "آماده تحویل" : "Ready", completed: fa ? "تکمیل شد" : "Completed", rejected: fa ? "رد شد" : "Rejected", cancelled: fa ? "لغو شد" : "Cancelled" } as Record<string, string>)[order.status] ?? order.status;
  const currentStep = activeSteps.indexOf(order.status);

  async function refresh() {
    setRefreshing(true);
    const response = await fetch(`/api/orders/track/${token}`, { cache: "no-store" }).catch(() => null);
    if (response?.ok) { const data = await response.json(); setOrder(data.order); }
    setRefreshing(false);
  }

  useEffect(() => {
    const id = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 15_000);
    return () => window.clearInterval(id);
  });

  return <main dir={fa ? "rtl" : "ltr"} className="min-h-dvh bg-[#0e1117] px-4 py-10 text-white">
    <div className="mx-auto max-w-xl">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-cyan-300">Foryxo Menu</p><h1 className="mt-1 text-2xl font-black">{fa ? "پیگیری سفارش" : "Track your order"}</h1><p className="mt-2 font-mono text-sm text-white/65" dir="ltr">{order.number}</p></div><button type="button" onClick={() => void refresh()} disabled={refreshing} className="grid size-11 place-items-center rounded-full border border-white/15 hover:bg-white/10" aria-label={fa ? "تازه‌سازی وضعیت" : "Refresh status"}><RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} /></button></div>
        <div className={`mt-6 rounded-2xl border p-4 ${order.status === "rejected" || order.status === "cancelled" ? "border-red-400/30 bg-red-400/10" : "border-emerald-400/30 bg-emerald-400/10"}`}><div className="flex items-center gap-3">{order.status === "rejected" || order.status === "cancelled" ? <X className="size-6 text-red-300" /> : order.status === "preparing" ? <ChefHat className="size-6 text-emerald-300" /> : order.status === "completed" ? <Check className="size-6 text-emerald-300" /> : <Clock className="size-6 text-emerald-300" />}<div><p className="font-black">{statusLabel}</p><p className="mt-1 text-xs text-white/60">{fa ? "این صفحه هر ۱۵ ثانیه به‌روزرسانی می‌شود." : "This page refreshes every 15 seconds."}</p></div></div></div>
        {!['rejected', 'cancelled'].includes(order.status) ? <ol className="mt-6 grid grid-cols-5 gap-1" aria-label={fa ? "مراحل سفارش" : "Order progress"}>{activeSteps.map((step, index) => <li key={step} className="text-center"><span className={`mx-auto block h-1.5 rounded-full ${index <= currentStep ? "bg-cyan-400" : "bg-white/15"}`} /><span className="mt-2 block text-[10px] text-white/55">{index + 1}</span></li>)}</ol> : null}
        <div className="mt-6 space-y-3"><div className="flex justify-between gap-3"><span className="text-white/60">{fa ? "شعبه" : "Branch"}</span><span className="font-bold">{order.branchName ?? (fa ? "شعبه اصلی" : "Main branch")}</span></div><div className="flex justify-between gap-3"><span className="text-white/60">{fa ? "روش دریافت" : "Fulfillment"}</span><span className="font-bold">{order.orderType === "dine_in" ? (fa ? "سرو در محل" : "Dine-in") : order.orderType === "delivery" ? (fa ? "ارسال" : "Delivery") : (fa ? "بیرون‌بر" : "Pickup")}{order.tableLabel ? ` · ${fa ? "میز" : "Table"} ${order.tableLabel}` : ""}</span></div></div>
        <ul className="mt-6 divide-y divide-white/10 rounded-2xl bg-black/20 px-4">{order.items.map((item) => <li key={item.id} className="flex justify-between gap-4 py-3 text-sm"><span>{item.quantity} × {item.name}</span><span>{new Intl.NumberFormat(fa ? "fa-IR" : "en-US").format(item.lineTotal)}</span></li>)}</ul>
        <div className="mt-5 flex justify-between text-lg font-black"><span>{fa ? "مبلغ قابل پرداخت در شعبه" : "Pay at the branch"}</span><span>{new Intl.NumberFormat(fa ? "fa-IR" : "en-US").format(order.total)} {fa ? "تومان" : "Toman"}</span></div>
        {order.branchPhone ? <a href={`tel:${order.branchPhone}`} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 font-black text-slate-950 hover:bg-cyan-300"><Phone className="size-4" />{fa ? "تماس با شعبه" : "Call the branch"}</a> : null}
        <p className="mt-5 text-center text-xs leading-6 text-white/50">{fa ? "این لینک خصوصی را برای مشاهده وضعیت سفارش نگه دارید و با دیگران به اشتراک نگذارید." : "Keep this private link to check your order status; do not share it with others."}</p>
      </div>
    </div>
  </main>;
}
