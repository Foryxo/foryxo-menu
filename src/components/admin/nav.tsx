"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/domains/i18n/index";

export function AdminNav({ locale, labels: t, role, mobile }: { locale: "fa" | "en"; labels: Dictionary; role: string; mobile?: boolean }) {
  const pathname = usePathname();
  const allItems = [
    { href: `/${locale}/admin`, label: t.admin.overview, roles: ["superadmin", "admin", "finance", "support", "editor"] },
    { href: `/${locale}/admin/projects`, label: t.admin.projects, roles: ["superadmin", "admin", "support"] },
    { href: `/${locale}/admin/requests`, label: t.admin.requests, roles: ["superadmin", "admin", "support"] },
    { href: `/${locale}/admin/menus`, label: t.admin.menus, roles: ["superadmin", "admin", "editor"] },
    { href: `/${locale}/admin/branches`, label: locale === "fa" ? "شعبه‌ها" : "Branches", roles: ["superadmin", "admin", "editor"] },
    { href: `/${locale}/admin/qr`, label: "QR", roles: ["superadmin", "admin", "editor"] },
    { href: `/${locale}/admin/orders`, label: locale === "fa" ? "سفارش‌ها" : "Orders", roles: ["superadmin", "admin"] },
    { href: `/${locale}/admin/payments`, label: t.admin.payments, roles: ["superadmin", "admin", "finance"] },
    { href: `/${locale}/admin/pricing`, label: t.admin.pricing, roles: ["superadmin", "admin", "finance"] },
    { href: `/${locale}/admin/templates`, label: t.admin.templates, roles: ["superadmin", "admin", "support", "editor"] },
    { href: `/${locale}/admin/content`, label: t.admin.content, roles: ["superadmin", "admin", "editor"] },
    { href: `/${locale}/admin/users`, label: t.admin.clients, roles: ["superadmin", "admin"] },
    { href: `/${locale}/admin/reports`, label: locale === "fa" ? "گزارش کامل" : "Reports", roles: ["superadmin", "admin"] },
    { href: `/${locale}/creator`, label: locale === "fa" ? "استودیوی سازنده" : "Creator studio", roles: ["superadmin"] },
    { href: `/${locale}/admin/security`, label: t.admin.security, roles: ["superadmin", "admin"] },
  ];
  const items = allItems.filter((item) => item.roles.includes(role));

  if (mobile) {
    return (
      <nav className="mb-4 flex gap-1 overflow-x-auto lg:hidden" aria-label={t.admin.title}>
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={cn("shrink-0 rounded-lg px-3 py-2 text-xs font-bold", pathname === i.href ? "accent-bg" : "text-muted hover:bg-subtle")}
          >
            {i.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="mt-2 space-y-1" aria-label={t.admin.title}>
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={cn(
            "block rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
            pathname === i.href ? "accent-soft-bg accent-text" : "text-muted hover:bg-subtle hover:text-fg",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
