/**
 * Middleware — locale prefixing + anonymous visitor id + baseline security.
 * Runs on Edge; keep it dependency-light.
 */
import { NextResponse, type NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import { menus, orders } from "@/domains/db/schema/index";

const PUBLIC_FILE = /\.(.*)$/;
const BUNDLED_DEMOS = new Set(["atria", "crush", "district", "form", "khesht", "miette", "mora", "noir", "sunday", "volt"]);

function missingPage() {
  return new NextResponse(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 | Foryxo Menu</title></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0e1117;color:#f5f7ff;font-family:system-ui,sans-serif;text-align:center"><main style="padding:2rem"><p style="font-size:4rem;font-weight:900;margin:0">404</p><h1>صفحه پیدا نشد · Page not found</h1><p>این نشانی وجود ندارد. The address does not exist.</p><a href="/fa" style="color:#8daeff">بازگشت به خانه · Back home</a></main></body></html>`, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Next can stream a not-found UI after sending HTTP 200. For these public
  // dynamic document URLs, resolve existence before the response starts.
  if (req.method === "GET" || req.method === "HEAD") {
    const menuSlug = /^\/menus\/([a-z0-9-]+)\/menu\/?$/.exec(pathname)?.[1];
    if (menuSlug && !BUNDLED_DEMOS.has(menuSlug)) {
      const [published] = await getDb().select({ id: menus.id }).from(menus).where(and(eq(menus.slug, menuSlug), eq(menus.status, "published"))).limit(1);
      if (!published) return missingPage();
    }
    const orderToken = /^\/orders\/([^/]+)\/?$/.exec(pathname)?.[1];
    if (orderToken) {
      if (!/^[a-f0-9]{32,64}$/.test(orderToken)) return missingPage();
      const [order] = await getDb().select({ id: orders.id }).from(orders).where(eq(orders.publicToken, orderToken)).limit(1);
      if (!order) return missingPage();
    }
  }

  const pathLocale = pathname.split("/")[1];
  const locale = pathLocale === "en" || pathLocale === "fa"
    ? pathLocale
    : pathname.startsWith("/menus") && req.nextUrl.searchParams.get("lang") === "en"
      ? "en"
      : "fa";
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-foryxo-locale", locale);
  requestHeaders.set("x-foryxo-pathname", `${pathname}${req.nextUrl.search}`);

  // Skip assets & API & internal paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/menus") ||
    pathname.startsWith("/orders/") ||
    pathname.startsWith("/q/") ||
    pathname.startsWith("/indexnow-key/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/build") ||
    pathname.startsWith("/mock-gateway") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // /paths stay unprefixed and redirect to the default locale for canonical clarity.
  if (
    pathname === "/" ||
    ["/demos", "/pricing", "/features", "/how-it-works", "/faq", "/about", "/contact", "/security", "/privacy", "/terms", "/refund-policy", "/blog", "/login", "/register"].some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
  ) {
    // Detect locale: cookie > Accept-Language
    const cookie = req.cookies.get("foryxo_locale")?.value;
    const header = req.headers.get("accept-language") ?? "";
    const prefersFa = header.toLowerCase().includes("fa");
    const preferredLocale = cookie === "en" || cookie === "fa" ? cookie : prefersFa ? "fa" : "en";

    const url = req.nextUrl.clone();
    url.pathname = `/${preferredLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // Rewriting unknown paths to a synthetic locale route caused a production
  // 500. Return a small, real 404 before the locale catch-all can stream a 200.
  if (pathLocale !== "fa" && pathLocale !== "en") {
    return missingPage();
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
