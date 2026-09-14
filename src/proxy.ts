/**
 * Middleware — locale prefixing + anonymous visitor id + baseline security.
 * Runs on Edge; keep it dependency-light.
 */
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  // Unknown unprefixed paths must stay a real 404 instead of being treated as
  // an invalid locale segment that streams a client-side fallback with status 200.
  if (pathLocale !== "fa" && pathLocale !== "en") {
    const url = req.nextUrl.clone();
    url.pathname = "/fa/__not-found";
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
