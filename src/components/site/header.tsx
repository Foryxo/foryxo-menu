"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ChevronRight, Menu, X, Globe } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/brand-mark";

export interface HeaderStrings {
  brand: string;
  demos: string;
  howItWorks: string;
  pricing: string;
  features: string;
  blog: string;
  projects: string;
  login: string;
  startMenu: string;
  menuToggle: string;
  themeLabel: string;
  langSwitchTo: string;
}

export function SiteHeader({
  locale,
  strings: t,
  isAuthenticated,
  isCreator,
  isAdmin,
  userName,
}: {
  locale: "fa" | "en";
  strings: HeaderStrings;
  isAuthenticated: boolean;
  isCreator: boolean;
  isAdmin: boolean;
  userName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const links = [
    { href: `/${locale}/demos`, label: t.demos },
    { href: `/${locale}/how-it-works`, label: t.howItWorks },
    { href: `/${locale}/pricing`, label: t.pricing },
    { href: `/${locale}/features`, label: t.features },
    { href: `/${locale}/blog`, label: t.blog },
    { href: `/${locale}/projects`, label: t.projects },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href={`/${locale}`} className="group flex items-center gap-2 font-extrabold tracking-tight">
          <BrandMark size={42} className="size-10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" priority />
          <span className="text-[15px]">{t.brand}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "nav-link-premium rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-fg",
                pathname.startsWith(l.href) && "text-fg",
              )}
              aria-current={pathname.startsWith(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="me-0 ms-auto hidden items-center gap-2 md:flex">
          <LocaleSwitch locale={locale} label={t.langSwitchTo} />
          <ThemeSwitch label={t.themeLabel} locale={locale} />
          {isAuthenticated ? (
            <Link href={isAdmin ? `/${locale}/admin` : isCreator ? `/${locale}/creator` : `/${locale}/dashboard`} className="group/profile inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-subtle">
              <span className="grid size-6 place-items-center rounded-full accent-soft-bg text-xs font-black accent-text" aria-hidden="true">{(userName ?? "U").trim().slice(0, 1).toUpperCase()}</span>
              <span className="max-w-28 truncate">{userName || (isAdmin ? (locale === "fa" ? "مدیریت" : "Admin") : isCreator ? (locale === "fa" ? "استودیوی من" : "My studio") : (locale === "fa" ? "پنل" : "Dashboard"))}</span>
            </Link>
          ) : (
            <Link href={`/${locale}/login`} className="rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:text-fg">
              {t.login}
            </Link>
          )}
          <Link href={`/${locale}/build`}>
            <Button size="sm">{t.startMenu}</Button>
          </Link>
        </div>

        <button
          type="button"
          className="group relative ms-auto grid size-10 place-items-center overflow-hidden rounded-xl border border-transparent text-fg transition-all duration-300 hover:border-line hover:bg-subtle hover:shadow-[var(--shadow-card)] active:scale-90 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={t.menuToggle}
          onClick={() => setOpen(!open)}
        >
          <AnimatePresence initial={false} mode="wait">
            {open ? (
              <motion.span
                key="close"
                className="absolute grid place-items-center"
                initial={reduceMotion ? false : { opacity: 0, rotate: -70, scale: 0.65 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, rotate: 70, scale: 0.65 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <X className="size-5" aria-hidden="true" />
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                className="absolute grid place-items-center"
                initial={reduceMotion ? false : { opacity: 0, rotate: 70, scale: 0.65 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, rotate: -70, scale: 0.65 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <Menu className="size-5 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id="mobile-navigation"
            className="fixed inset-x-0 bottom-0 top-16 z-50 md:hidden"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
          >
            <motion.button
              type="button"
              aria-label={locale === "fa" ? "بستن منوی موبایل" : "Close mobile menu"}
              className="absolute inset-0 size-full cursor-default bg-[color-mix(in_srgb,var(--bg)_48%,transparent)] backdrop-blur-sm"
              onClick={() => setOpen(false)}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
            />
            <motion.div
              className="absolute inset-x-3 top-3 max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-[1.75rem] border border-line bg-elevated p-3 shadow-[0_24px_80px_-24px_rgb(0_0_0/0.45)]"
              initial={reduceMotion ? false : { opacity: 0, y: -22, scale: 0.975 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -14, scale: 0.985 }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34, mass: 0.8 }}
            >
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-70" aria-hidden="true" />
              <nav className="flex flex-col gap-1" aria-label="Mobile">
                {links.map((l, index) => {
                  const active = pathname.startsWith(l.href);
                  return (
                    <motion.div
                      key={l.href}
                      initial={reduceMotion ? false : { opacity: 0, x: locale === "fa" ? 12 : -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: reduceMotion ? 0 : 0.035 * index, duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group/mobile flex min-h-12 items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 active:scale-[0.98]",
                          locale === "fa" ? "hover:-translate-x-1" : "hover:translate-x-1",
                          active ? "accent-soft-bg accent-text" : "text-muted hover:bg-subtle hover:text-fg",
                        )}
                      >
                        <span>{l.label}</span>
                        <ArrowMark rtl={locale === "fa"} />
                      </Link>
                    </motion.div>
                  );
                })}

                <motion.div
                  className="mt-3 border-t border-line pt-3"
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.2, duration: reduceMotion ? 0 : 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <LocaleSwitch locale={locale} label={t.langSwitchTo} />
                    <ThemeSwitch label={t.themeLabel} locale={locale} />
                    {isAuthenticated ? (
                      <Link
                        href={isAdmin ? `/${locale}/admin` : isCreator ? `/${locale}/creator` : `/${locale}/dashboard`}
                        onClick={() => setOpen(false)}
                        className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-line px-4 text-center text-sm font-semibold transition-all hover:border-[var(--accent)] hover:bg-subtle active:scale-[0.98]"
                      >
                        {userName || (isAdmin ? (locale === "fa" ? "مدیریت" : "Admin") : isCreator ? (locale === "fa" ? "استودیو" : "Studio") : (locale === "fa" ? "پنل" : "Dashboard"))}
                      </Link>
                    ) : (
                      <Link
                        href={`/${locale}/login`}
                        onClick={() => setOpen(false)}
                        className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-line px-4 text-center text-sm font-semibold transition-all hover:border-[var(--accent)] hover:bg-subtle active:scale-[0.98]"
                      >
                        {t.login}
                      </Link>
                    )}
                  </div>
                  <Link href={`/${locale}/build`} onClick={() => setOpen(false)} className="mt-2 block">
                    <Button className="w-full shadow-[0_12px_30px_-14px_var(--accent)]">{t.startMenu}</Button>
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function ArrowMark({ rtl }: { rtl: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-7 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] text-[var(--accent)] transition-all duration-300 group-hover/mobile:scale-110 group-hover/mobile:bg-[var(--accent)] group-hover/mobile:text-[var(--accent-fg)]",
        rtl && "rotate-180",
      )}
    >
      <ChevronRight className="size-3.5" />
    </span>
  );
}

function LocaleSwitch({ locale, label }: { locale: "fa" | "en"; label: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const nextLocale = locale === "fa" ? "en" : "fa";
  const nextPath = pathname.replace(/^\/(fa|en)(?=\/|$)/, `/${nextLocale}`);
  const query = searchParams.toString();
  const href = `${nextPath}${query ? `?${query}` : ""}`;
  return (
    <Link
      href={href}
      onClick={(event) => {
        event.preventDefault();
        document.cookie = `foryxo_locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
        router.push(`${href}${window.location.hash}`);
      }}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-muted hover:bg-subtle hover:text-fg"
      title={label}
    >
      <Globe className="size-4" aria-hidden="true" />
      {locale === "fa" ? "EN" : "فا"}
    </Link>
  );
}

function ThemeSwitch({ label, locale }: { label: string; locale: "fa" | "en" }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const next = isDark ? "light" : "dark";
  const stateLabel = locale === "fa"
    ? isDark ? "تیره" : "روشن"
    : isDark ? "Dark" : "Light";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`${label}: ${stateLabel}`}
      title={`${label}: ${stateLabel}`}
      className="theme-orbit group relative grid size-10 place-items-center overflow-hidden rounded-full border border-line bg-elevated text-muted transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_8px_24px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
    >
      <Image src="/theme/sun.webp" alt="" width={22} height={22} aria-hidden="true" className={`absolute size-[22px] transition-all duration-500 ${isDark ? "translate-y-8 rotate-90 opacity-0" : "translate-y-0 rotate-0 opacity-100"}`} />
      <Image src="/theme/moon.webp" alt="" width={22} height={22} aria-hidden="true" className={`absolute size-[22px] transition-all duration-500 ${isDark ? "translate-y-0 rotate-0 opacity-100" : "-translate-y-8 -rotate-90 opacity-0"}`} />
    </button>
  );
}
