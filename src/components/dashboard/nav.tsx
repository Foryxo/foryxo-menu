"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/domains/i18n/index";

export function DashboardNav({
  locale,
  labels: t,
  mobile,
}: {
  locale: "fa" | "en";
  labels: Dictionary;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const items = [
    { href: `/${locale}/dashboard`, label: t.dashboard.overview },
    { href: `/${locale}/dashboard/projects`, label: t.dashboard.projects },
    { href: `/${locale}/dashboard/orders`, label: locale === "fa" ? "سفارش‌ها" : "Orders" },
    { href: `/${locale}/dashboard/branches`, label: locale === "fa" ? "شعبه‌ها" : "Branches" },
    { href: `/${locale}/dashboard/wallet`, label: t.dashboard.wallet },
    { href: `/${locale}/dashboard/invoices`, label: t.dashboard.invoices },
    { href: `/${locale}/dashboard/requests`, label: t.dashboard.requests },
    { href: `/${locale}/dashboard/files`, label: t.dashboard.files },
    { href: `/${locale}/dashboard/security`, label: t.dashboard.security },
  ];

  if (mobile) {
    return (
      <nav className="flex gap-1 overflow-x-auto pb-1" aria-label={t.dashboard.overview}>
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-xs font-bold",
              pathname === i.href ? "accent-bg" : "text-muted hover:bg-subtle",
            )}
          >
            {i.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="mt-2 space-y-1" aria-label={t.dashboard.overview}>
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={cn(
            "block rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
            pathname === i.href || (i.href !== `/${locale}/dashboard` && pathname.startsWith(i.href))
              ? "accent-soft-bg accent-text"
              : "text-muted hover:bg-subtle hover:text-fg",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
