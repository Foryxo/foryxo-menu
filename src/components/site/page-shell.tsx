import type { ReactNode } from "react";
import { getDictionary, type Locale } from "@/domains/i18n/index";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";
import { QuickActions } from "./quick-actions";

/**
 * Server-side shell shared by every public marketing page.
 * Reads auth state server-side so the header renders correct CTAs.
 */
export async function PageShell({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const t = getDictionary(locale);
  let isAuthenticated = false;
  let isCreator = false;
  let isAdmin = false;
  let userName: string | null = null;
  const isStaticPages = process.env.GITHUB_PAGES === "true";
  if (!isStaticPages) {
    const { headers } = await import("next/headers");
    const requestHeaders = await headers();
    try {
      const { auth } = await import("@/domains/auth/server");
      const session = await auth.api.getSession({ headers: requestHeaders });
      isAuthenticated = Boolean(session?.user);
      userName = session?.user?.name || session?.user?.email || null;
      const role = (session?.user as { role?: string } | undefined)?.role;
      isAdmin =
        role === "superadmin" ||
        ["admin", "finance", "support", "editor"].includes(role ?? "");
      isCreator = role === "creator";
    } catch {
      isAuthenticated = false;
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        locale={locale}
        isAuthenticated={isAuthenticated}
        isCreator={isCreator}
        isAdmin={isAdmin}
        userName={userName}
        showLogin={!isStaticPages}
        strings={{
          brand: t.common.brand,
          demos: t.nav.demos,
          howItWorks: t.nav.howItWorks,
          pricing: t.nav.pricing,
          features: t.nav.features,
          blog: t.nav.blog,
          projects: t.nav.projects,
          login: t.common.login,
          startMenu: t.nav.startMenu,
          menuToggle: t.common.menuToggle,
          themeLabel: t.common.theme,
          langSwitchTo: t.common.language,
        }}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter locale={locale} />
      <QuickActions locale={locale} isAuthenticated={isAuthenticated} />
    </div>
  );
}
