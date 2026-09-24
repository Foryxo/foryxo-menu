import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const pagesBasePath = isGitHubPages ? "/foryxo-menu" : "";

/**
 * Content-Security-Policy:
 * - Development needs 'unsafe-inline'/'unsafe-eval' for Next dev overlay + Turbopack HMR.
 * - Production uses strict nonce-less policy; inline styles allowed for Radix + theme flash script.
 * - Google OAuth + ZarinPal + YekPay hosts whitelisted for redirects/forms.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://accounts.google.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://api.zarinpal.com https://payment.zarinpal.com https://api.yekpay.com" +
    (isDev ? " ws: wss:" : ""),
  "frame-src 'self' https://accounts.google.com https://payment.zarinpal.com https://api.yekpay.com",
  "form-action 'self' https://accounts.google.com https://payment.zarinpal.com https://api.yekpay.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isGitHubPages
    ? {
        output: "export" as const,
        basePath: pagesBasePath,
        assetPrefix: pagesBasePath,
        trailingSlash: true,
      }
    : {}),
  // The 8 GB production VPS cannot repeat the already-verified TypeScript pass
  // during `next build`. Only the deployment command may opt out; local/CI
  // builds still type-check by default.
  typescript: {
    ignoreBuildErrors: process.env.FORYXO_SKIP_BUILD_TYPECHECK === "1",
  },
  // PGLite embeds a WASM Postgres with Node-FS internals that must not be
  // bundled by Turbopack (URL/path shims break its filesystem layer).
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    unoptimized: isGitHubPages,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "menu.foryxo.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  ...(!isGitHubPages
    ? {
        async headers() {
          return [
            { source: "/(.*)", headers: securityHeaders },
            {
              source:
                "/:locale(fa|en)/:area(dashboard|admin|creator|account)/:path*",
              headers: [
                { key: "Cache-Control", value: "private, no-store, max-age=0" },
              ],
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
