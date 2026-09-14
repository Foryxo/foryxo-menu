import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

/**
 * Tailwind v4 is CSS-first; this file only exists for the typography plugin.
 * Design tokens live in src/app/globals.css via @theme.
 */
export default {
  plugins: [typography],
} satisfies Partial<Config>;
