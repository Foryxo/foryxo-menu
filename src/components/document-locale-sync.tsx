"use client";

import { useEffect } from "react";
import type { Locale } from "@/domains/i18n/config";

/** Keeps document semantics correct when Next performs a client-side locale navigation. */
export function DocumentLocaleSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
  }, [locale]);

  return null;
}
