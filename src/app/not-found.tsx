import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";

export default function RootNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center" dir="rtl">
      <BrandMark size={128} className="mb-3 drop-shadow-xl" priority />
      <span className="text-6xl font-black accent-text" aria-hidden="true">404</span>
      <h1 className="display-3 mt-4">صفحه‌ای که می‌خواستید پیدا نشد</h1>
      <p className="mt-2 text-muted" dir="ltr" lang="en">That page doesn&apos;t exist</p>
      <Link href="/fa" className="mt-8 flex h-11 items-center rounded-xl accent-bg px-6 text-sm font-bold">
        صفحه اصلی
      </Link>
    </div>
  );
}
