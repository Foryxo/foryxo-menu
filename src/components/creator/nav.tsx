"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, MessagesSquare, FileText, BarChart3, ShieldCheck, QrCode, Images, ShoppingBag, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreatorNav({ locale, mobile = false, canAccessAdmin = false }: { locale: "fa" | "en"; mobile?: boolean; canAccessAdmin?: boolean }) {
  const path = usePathname();
  const fa = locale === "fa";
  const items = [
    ["", fa ? "نمای کلی" : "Overview", LayoutDashboard],
    ["/clients", fa ? "مشتریان" : "Clients", Users],
    ["/projects", fa ? "بریف‌های ساخت" : "Build briefs", ClipboardList],
    ["/inbox", fa ? "گفت‌وگوها" : "Inbox", MessagesSquare],
    ["/quotes", fa ? "سفارش و هزینه" : "Orders & quotes", FileText],
    ["/orders", fa ? "سفارش‌های آنلاین" : "Online orders", ShoppingBag],
    ["/assets", fa ? "عکس‌های مشتری" : "Client photos", Images],
    ["/qr", fa ? "QR منو و میزها" : "Menu & table QR", QrCode],
    ["/reports", fa ? "گزارش‌ها" : "Reports", BarChart3],
  ] as const;
  const cls = mobile ? "mb-4 flex gap-1 overflow-x-auto lg:hidden" : "mt-3 space-y-1";
  return (
    <nav className={cls} aria-label={fa ? "پنل سازنده" : "Creator workspace"}>
      {items.map(([suffix, label, Icon]) => {
        const href = `/${locale}/creator${suffix}`;
        const active = suffix ? path.startsWith(href) : path === href;
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors", mobile && "shrink-0", active ? "accent-soft-bg accent-text" : "text-muted hover:bg-subtle hover:text-fg")}><Icon className="size-4" aria-hidden="true" />{label}</Link>;
      })}
      {!mobile && canAccessAdmin ? <Link href={`/${locale}/admin`} className="mt-4 flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-bold text-muted hover:bg-subtle"><ShieldCheck className="size-4" aria-hidden="true" />{fa ? "پنل مدیریت" : "Admin panel"}</Link> : null}
    </nav>
  );
}
