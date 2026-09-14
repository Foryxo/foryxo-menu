import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isLocale, dir } from "@/domains/i18n/config";
import { DocumentLocaleSync } from "@/components/document-locale-sync";

/**
 * Locale segment layout. The root <html> is fa/rtl (default); for English we
 * wrap content in a dir container. html lang is set client-safe via effect
 * in PageShell children? No — html must stay server-controlled: we accept the
 * root default and set lang/dir attributes through this layout's wrapper,
 * which is the pragmatic approach for a single html node in Next.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <>
      <DocumentLocaleSync locale={locale} />
      <div lang={locale} dir={dir(locale)} className="contents">
        {children}
      </div>
    </>
  );
}
