import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    // Fold accented latin (é → e) before stripping non-alphanumerics.
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

/** Reserved slugs that must never be assignable to menus. */
export const RESERVED_SLUGS = new Set([
  "admin", "api", "dashboard", "account", "build", "demos", "pricing",
  "features", "blog", "faq", "about", "contact", "login", "register",
  "verify", "privacy", "terms", "refund-policy", "security", "how-it-works",
  "menus", "fa", "en", "static", "public", "favicon.ico", "robots.txt",
  "sitemap.xml", "llms.txt",
]);

export function isSafeSlug(slug: string): boolean {
  return (
    /^[a-z0-9][a-z0-9-]{1,47}$/.test(slug) &&
    !RESERVED_SLUGS.has(slug) &&
    !slug.includes("--")
  );
}

export function randomId(bytes = 12): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function sanitizeNote(input: string, maxLen = 200): string {
  // Strip control chars & HTML-significant chars; collapse whitespace.
  return input
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>&"']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
