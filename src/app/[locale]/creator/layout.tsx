import type { ReactNode } from "react";
import { headers } from "next/headers";
import { requireCreator } from "@/domains/auth/guards";
import { isLocale } from "@/domains/i18n/config";
import { CreatorNav } from "@/components/creator/nav";
import { BrandMark } from "@/components/brand/brand-mark";

export const metadata = { robots: { index: false, follow: false } };
export default async function CreatorLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const requestHeaders = await headers();
  const nextPath = requestHeaders.get("x-foryxo-pathname") ?? `/${l}/creator`;
  const { session, role } = await requireCreator(nextPath);
  const canAccessAdmin = role === "superadmin";
  return <div className="min-h-dvh bg-app"><div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6"><aside className="sticky top-6 hidden h-fit w-64 shrink-0 lg:block"><div className="surface rounded-2xl p-4"><div className="flex items-center gap-3"><BrandMark size={52} className="size-13" /><div className="min-w-0"><p className="text-xs font-black accent-text">{l === "fa" ? "استودیوی سازنده" : "Creator studio"}</p><p className="truncate text-sm font-extrabold">{session.user.email}</p></div></div></div><CreatorNav locale={l} canAccessAdmin={canAccessAdmin} /></aside><main id="main" className="min-w-0 flex-1"><CreatorNav locale={l} canAccessAdmin={canAccessAdmin} mobile />{children}</main></div></div>;
}
