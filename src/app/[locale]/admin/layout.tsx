import type { ReactNode } from "react";
import { headers } from "next/headers";
import { requireAdmin } from "@/domains/auth/guards";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { AdminNav } from "@/components/admin/nav";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const requestHeaders = await headers();
  const nextPath = requestHeaders.get("x-foryxo-pathname") ?? `/${l}/admin`;
  const { session, role } = await requireAdmin(nextPath, ["superadmin", "admin", "finance", "support", "editor"]);
  const t = getDictionary(l);

  return (
    <div className="min-h-dvh bg-app">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <aside className="sticky top-6 hidden h-fit w-56 shrink-0 lg:block">
          <div className="surface rounded-2xl p-4">
            <div className="text-xs text-muted">{t.admin.title}</div>
            <div className="mt-1 truncate text-sm font-extrabold">{session.user.email}</div>
          </div>
          <AdminNav locale={l} labels={t} role={role} />
        </aside>
        <main id="main" className="min-w-0 flex-1">
          <AdminNav locale={l} labels={t} role={role} mobile />
          {children}
        </main>
      </div>
    </div>
  );
}
