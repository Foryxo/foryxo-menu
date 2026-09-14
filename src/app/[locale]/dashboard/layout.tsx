import type { ReactNode } from "react";
import { headers } from "next/headers";
import { requireUser } from "@/domains/auth/guards";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { DashboardNav } from "@/components/dashboard/nav";
import { SignOutButton } from "@/components/dashboard/sign-out";

export const metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const requestHeaders = await headers();
  const nextPath = requestHeaders.get("x-foryxo-pathname") ?? `/${l}/dashboard`;
  const session = await requireUser(nextPath);
  const t = getDictionary(l);
  const name = session.user.name || session.user.email;

  return (
    <div className="min-h-dvh bg-app">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="sticky top-6 hidden h-fit w-60 shrink-0 md:block">
          <div className="surface rounded-2xl p-4">
            <div className="mb-1 text-xs text-muted">{t.dashboard.welcome}</div>
            <div className="truncate text-sm font-extrabold">{name}</div>
          </div>
          <DashboardNav locale={l} labels={t} />
          {(session.user as { role?: string }).role === "superadmin" ||
          ["admin", "finance", "support", "editor"].includes((session.user as { role?: string }).role ?? "") ? (
            <a
              href={`/${l}/admin`}
              className="mt-2 block rounded-xl px-4 py-2.5 text-sm font-bold accent-text hover:bg-subtle"
            >
              {t.common.adminPanel} →
            </a>
          ) : null}
          <SignOutButton locale={l} label={t.common.logout} />
        </aside>
        <main id="main" className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <div className="mb-4 flex items-center justify-between md:hidden">
            <div className="truncate text-sm font-extrabold">{name}</div>
            <SignOutButton locale={l} label={t.common.logout} compact />
          </div>
          <DashboardNav locale={l} labels={t} mobile />
          {children}
        </main>
      </div>
    </div>
  );
}
