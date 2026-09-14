import type { MetadataRoute } from "next";
import { SITE_URL } from "@/domains/seo/hreflang";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/dashboard",
          "/account",
          "/api",
          "/build/review/preview",
          "/*/dashboard",
          "/*/admin",
          "/*/creator",
          "/*/account",
          "/*/dashboard",
          "/*/login",
          "/*/register",
        ],
      },
      // AI crawlers: configurable policy — allow factual public content by default.
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot"],
        allow: ["/fa", "/en", "/menus"],
        disallow: ["/admin", "/dashboard", "/creator", "/account", "/api", "/*/admin", "/*/dashboard", "/*/creator"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
