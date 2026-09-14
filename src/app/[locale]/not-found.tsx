import Link from "next/link";
import { headers } from "next/headers";
import { BrandMark } from "@/components/brand/brand-mark";

export default async function LocaleNotFound() {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-foryxo-locale") === "en" ? "en" : "fa";
  const isFa = locale === "fa";
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
      dir={isFa ? "rtl" : "ltr"}
      lang={locale}
    >
      <BrandMark size={128} className="mb-3 drop-shadow-xl" priority />
      <span className="text-6xl font-black accent-text" aria-hidden="true">404</span>
      <h1 className="display-3 mt-4">
        {isFa ? "صفحه‌ای که می‌خواستید پیدا نشد" : "That page doesn’t exist"}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-muted">
        {isFa
          ? "ممکن است نشانی تغییر کرده باشد یا صفحه دیگر در دسترس نباشد."
          : "The address may have changed, or the page may no longer be available."}
      </p>
      <Link
        href={`/${locale}`}
        className="mt-8 flex h-11 items-center rounded-xl accent-bg px-6 text-sm font-bold"
      >
        {isFa ? "بازگشت به صفحه اصلی" : "Back to home"}
      </Link>
    </div>
  );
}

export function generateMetadata() {
  return { title: "404" };
}

export const dynamic = "force-dynamic";
