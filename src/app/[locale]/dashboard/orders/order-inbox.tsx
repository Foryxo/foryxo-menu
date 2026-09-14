"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, ChefHat, CircleCheck, Clock, MapPin, MessageCircle, Phone, RefreshCw, Search, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatToman } from "@/domains/i18n/format";
import type { Locale } from "@/domains/i18n/config";

interface OrderItem { id: string; nameSnapshot: string; quantity: number; lineTotal: number; note: string | null; modifiersSnapshot: unknown }
interface OrderRow {
  id: string; number: string; status: string; orderType: string; customerName: string | null; customerPhone: string | null;
  customerAddress: string | null; note: string | null; total: number; tableToken: string | null; createdAt: string; updatedAt: string;
  branchName: string | null; businessName: string; items: OrderItem[];
}

export function OrderInbox({ locale, initialOrders }: { locale: Locale; initialOrders: OrderRow[] }) {
  const fa = locale === "fa";
  const router = useRouter();
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notificationState, setNotificationState] = useState<NotificationPermission | "unsupported">(() => typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  const [query, setQuery] = useState("");
  const [businessFilter, setBusinessFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const previousIds = useRef(new Set(initialOrders.map((order) => order.id)));

  useEffect(() => {
    const incoming = initialOrders.filter((order) => order.status === "awaiting_confirmation" && !previousIds.current.has(order.id));
    if (incoming.length && typeof Notification !== "undefined" && Notification.permission === "granted") {
      for (const order of incoming) new Notification(fa ? `سفارش جدید ${order.number}` : `New order ${order.number}`, { body: `${order.branchName ?? ""} · ${formatToman(order.total, locale)}`, icon: "/icon.png" });
      try {
        const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextCtor) { const audio = new AudioContextCtor(); const oscillator = audio.createOscillator(); oscillator.frequency.value = 880; oscillator.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + 0.18); }
      } catch { /* Browser notifications remain available when audio is blocked. */ }
    }
    previousIds.current = new Set(initialOrders.map((order) => order.id));
  }, [fa, initialOrders, locale]);

  useEffect(() => {
    const id = window.setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 12_000);
    return () => window.clearInterval(id);
  }, [router]);

  const activeStatuses = new Set(["placed", "awaiting_confirmation", "accepted", "preparing", "ready"]);
  const businessOptions = Array.from(new Set(initialOrders.map((order) => order.businessName))).sort();
  const branchOptions = Array.from(new Set(initialOrders.map((order) => order.branchName).filter((name): name is string => Boolean(name)))).sort();
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const filtered = initialOrders.filter((order) => {
    if (filter !== "all" && (filter === "active" ? !activeStatuses.has(order.status) : activeStatuses.has(order.status))) return false;
    if (businessFilter && order.businessName !== businessFilter) return false;
    if (branchFilter && order.branchName !== branchFilter) return false;
    if (!normalizedQuery) return true;
    return [order.number, order.customerName, order.customerPhone, order.businessName, order.branchName].filter(Boolean).some((value) => String(value).toLocaleLowerCase(locale).includes(normalizedQuery));
  });
  const statusText = (status: string) => ({ awaiting_confirmation: fa ? "منتظر پذیرش" : "Awaiting confirmation", accepted: fa ? "پذیرفته شد" : "Accepted", preparing: fa ? "در حال آماده‌سازی" : "Preparing", ready: fa ? "آماده تحویل" : "Ready", completed: fa ? "تکمیل شد" : "Completed", rejected: fa ? "رد شد" : "Rejected" }[status] ?? status);

  async function update(order: OrderRow, status: string) {
    const note = status === "rejected" ? window.prompt(fa ? "دلیل رد سفارش را برای ثبت داخلی بنویسید:" : "Enter the rejection reason for the order log:") : "";
    if (status === "rejected" && !note?.trim()) return;
    setBusy(order.id); setActionError(null);
    const res = await fetch(`/api/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, note: note ?? "" }) }).catch(() => null);
    if (res?.ok) router.refresh();
    else { setActionError(fa ? "وضعیت سفارش تغییر نکرد. صفحه را تازه کنید و دوباره تلاش کنید." : "The order was not updated. Refresh and try again."); if (res?.status === 409) router.refresh(); }
    setBusy(null);
  }

  async function enableAlerts() {
    if (typeof Notification !== "undefined") setNotificationState(await Notification.requestPermission());
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-black accent-text">{fa ? "به‌روزرسانی خودکار هر ۱۲ ثانیه" : "Auto-refreshes every 12 seconds"}</p><h1 className="display-3 mt-1">{fa ? "سفارش‌های آنلاین" : "Online orders"}</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{fa ? "سفارش‌ها را به‌ترتیب بپذیرید، آماده کنید و تحویل دهید. شماره مشتری فقط برای هماهنگی همین سفارش نمایش داده می‌شود." : "Accept, prepare, and complete orders in sequence. Customer contact details are shown only for order coordination."}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => router.refresh()}><RefreshCw className="size-4" />{fa ? "تازه‌سازی" : "Refresh"}</Button><Button onClick={() => void enableAlerts()} disabled={notificationState === "unsupported" || notificationState === "granted"}><Bell className="size-4" />{notificationState === "granted" ? (fa ? "اعلان فعال است" : "Alerts enabled") : notificationState === "denied" ? (fa ? "اعلان مسدود است" : "Alerts blocked") : notificationState === "unsupported" ? (fa ? "اعلان پشتیبانی نمی‌شود" : "Alerts unavailable") : (fa ? "فعال‌کردن اعلان" : "Enable alerts")}</Button></div></header>
      {actionError ? <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-300">{actionError}</p> : null}
      <div className="flex flex-wrap gap-2">{([['active', fa ? 'فعال' : 'Active'], ['completed', fa ? 'بسته‌شده' : 'Closed'], ['all', fa ? 'همه' : 'All']] as const).map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${filter === value ? "accent-bg" : "surface hover:bg-subtle"}`}>{label}</button>)}</div>
      <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_220px_220px]">
        <label className="relative"><span className="sr-only">{fa ? "جستجوی سفارش" : "Search orders"}</span><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={fa ? "شماره سفارش، مشتری یا تلفن…" : "Order, customer, or phone…"} className="h-11 w-full rounded-xl border border-line bg-elevated pe-3 ps-10 text-sm outline-none focus:border-accent" /></label>
        <label><span className="sr-only">{fa ? "فیلتر کسب‌وکار" : "Filter business"}</span><select value={businessFilter} onChange={(event) => setBusinessFilter(event.target.value)} className="h-11 w-full rounded-xl border border-line bg-elevated px-3 text-sm outline-none"><option value="">{fa ? "همه کسب‌وکارها" : "All businesses"}</option>{businessOptions.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label><span className="sr-only">{fa ? "فیلتر شعبه" : "Filter branch"}</span><select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)} className="h-11 w-full rounded-xl border border-line bg-elevated px-3 text-sm outline-none"><option value="">{fa ? "همه شعبه‌ها" : "All branches"}</option>{branchOptions.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
      </div>
      {!filtered.length ? <div className="surface rounded-2xl p-12 text-center"><ShoppingBag className="mx-auto size-9 text-muted" /><p className="mt-3 font-bold">{fa ? "سفارشی در این بخش نیست." : "No orders in this view."}</p></div> : <div className="grid gap-4 xl:grid-cols-2">{filtered.map((order) => {
        const phone = (order.customerPhone ?? "").replace(/[^\d+]/g, "");
        const digits = phone.replace(/\D/g, "");
        const whatsapp = phone.startsWith("+") ? digits : /^09\d{9}$/.test(digits) ? `98${digits.slice(1)}` : "";
        return <article key={order.id} className={`surface overflow-hidden rounded-2xl border ${order.status === "awaiting_confirmation" ? "border-amber-400" : "border-line"}`}>
          <div className="flex items-start justify-between gap-3 border-b border-line p-5"><div><p className="text-xs font-bold accent-text">{order.businessName}</p><p className="mt-1 font-black" dir="ltr">{order.number}</p><p className="mt-1 text-xs text-muted">{new Intl.DateTimeFormat(fa ? "fa-IR" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}</p></div><span className="rounded-full bg-subtle px-3 py-1 text-xs font-black">{statusText(order.status)}</span></div>
          <div className="space-y-4 p-5"><div className="flex flex-wrap gap-x-5 gap-y-2 text-sm"><span className="font-bold">{order.branchName ?? (fa ? "شعبه اصلی" : "Main branch")}</span><span>{order.orderType === "dine_in" ? (fa ? "سرو در محل" : "Dine-in") : order.orderType === "takeaway" ? (fa ? "بیرون‌بر" : "Pickup") : (fa ? "ارسال" : "Delivery")}</span>{order.tableToken ? <span>{fa ? "میز" : "Table"} {order.tableToken}</span> : null}</div>
            <ul className="divide-y divide-[var(--line)] rounded-xl bg-subtle px-4">{order.items.map((item) => <li key={item.id} className="py-3 text-sm"><div className="flex justify-between gap-3"><span className="font-bold">{item.quantity} × {item.nameSnapshot}</span><span>{formatToman(item.lineTotal, locale)}</span></div>{Array.isArray(item.modifiersSnapshot) && item.modifiersSnapshot.length ? <p className="mt-1 text-xs text-muted">{(item.modifiersSnapshot as { name: string }[]).map((modifier) => modifier.name).join(" · ")}</p> : null}{item.note ? <p className="mt-1 text-xs text-muted">{item.note}</p> : null}</li>)}</ul>
            <div className="flex justify-between text-base font-black"><span>{fa ? "جمع" : "Total"}</span><span className="accent-text">{formatToman(order.total, locale)}</span></div>
            <div className="rounded-xl border border-line p-3 text-sm"><p className="font-bold">{order.customerName}</p>{order.customerAddress ? <p className="mt-1 flex gap-1 text-muted"><MapPin className="mt-0.5 size-4 shrink-0" />{order.customerAddress}</p> : null}{order.note ? <p className="mt-2 text-muted">{fa ? "یادداشت: " : "Note: "}{order.note}</p> : null}<div className="mt-3 flex gap-2">{phone ? <a href={`tel:${phone}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-xs font-bold hover:accent-soft-bg"><Phone className="size-4" />{fa ? "تماس" : "Call"}</a> : null}{whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-xs font-bold hover:accent-soft-bg"><MessageCircle className="size-4" />WhatsApp</a> : null}</div></div>
            <div className="flex flex-wrap gap-2">{order.status === "awaiting_confirmation" ? <><Button disabled={busy === order.id} onClick={() => void update(order, "accepted")}><Check />{fa ? "پذیرش" : "Accept"}</Button><Button variant="danger" disabled={busy === order.id} onClick={() => void update(order, "rejected")}><X />{fa ? "رد" : "Reject"}</Button></> : null}{order.status === "accepted" ? <Button disabled={busy === order.id} onClick={() => void update(order, "preparing")}><ChefHat />{fa ? "شروع آماده‌سازی" : "Start preparing"}</Button> : null}{order.status === "preparing" ? <Button disabled={busy === order.id} onClick={() => void update(order, "ready")}><Clock />{fa ? "آماده است" : "Mark ready"}</Button> : null}{order.status === "ready" ? <Button disabled={busy === order.id} onClick={() => void update(order, "completed")}><CircleCheck />{fa ? "تحویل شد" : "Complete"}</Button> : null}</div>
          </div>
        </article>;
      })}</div>}
    </div>
  );
}
