"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ErrorState } from "@/components/feedback/error-state";
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "fa";
  useEffect(() => { console.error(error); }, [error]);
  return <div data-runtime-error="true"><ErrorState title={locale === "fa" ? "مشکلی پیش آمد" : "Something went wrong"} body={locale === "fa" ? "این صفحه کامل بارگذاری نشد. دوباره تلاش کنید؛ داده‌های ثبت‌شده شما پاک نشده‌اند." : "This page did not finish loading. Try again; your saved data has not been removed."} retry={retry} digest={error.digest} locale={locale} /></div>;
}
