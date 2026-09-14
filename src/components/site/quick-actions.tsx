"use client";

import Link from "next/link";
import { useState } from "react";
import { Headphones, MessageCircle, Plus, Sparkles, X } from "lucide-react";
import type { Locale } from "@/domains/i18n/config";

export function QuickActions({ locale, isAuthenticated = false }: { locale: Locale; isAuthenticated?: boolean }) {
  const [open, setOpen] = useState(false);
  const fa = locale === "fa";
  const actions = [
    { href: isAuthenticated ? `/${locale}/dashboard/requests` : `/${locale}/contact`, label: fa ? "پشتیبانی و تیکت" : "Support & tickets", Icon: Headphones },
    { href: `/${locale}/build`, label: fa ? "شروع ساخت منو" : "Start a menu", Icon: Sparkles },
    { href: "https://wa.me/989109855546", label: fa ? "گفت‌وگو در واتساپ" : "Chat on WhatsApp", Icon: MessageCircle, external: true },
  ];

  return (
    <div className="fixed bottom-5 end-5 z-50 flex flex-col items-end gap-2" dir={fa ? "rtl" : "ltr"}>
      <div className={`flex flex-col items-end gap-2 transition-all duration-300 ${open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`} aria-hidden={!open}>
        {actions.map(({ href, label, Icon, external }, index) => (
          <Link
            key={href}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            tabIndex={open ? 0 : -1}
            className="group flex items-center gap-2 rounded-full border border-line bg-elevated px-3 py-2.5 text-sm font-bold shadow-[var(--shadow-pop)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]"
            style={{ transitionDelay: open ? `${index * 45}ms` : "0ms" }}
          >
            <span>{label}</span>
            <span className="grid size-8 place-items-center rounded-full accent-soft-bg accent-text transition-transform group-hover:rotate-6 group-hover:scale-110"><Icon className="size-4" aria-hidden="true" /></span>
          </Link>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? (fa ? "بستن دسترسی سریع" : "Close quick actions") : (fa ? "دسترسی سریع" : "Quick actions")}
        className="soft-pulse grid size-14 place-items-center rounded-full accent-bg shadow-[var(--shadow-pop)] transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Plus className="size-5 transition-transform group-hover:rotate-90" aria-hidden="true" />}
      </button>
    </div>
  );
}
