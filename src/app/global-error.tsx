"use client";
import "./globals.css";
import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/error-state";
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <html lang="fa" dir="rtl"><body data-runtime-error="true"><title>خطای فوریکسو منو</title><ErrorState title="مشکلی پیش آمد" body="بخش موردنظر بارگذاری نشد. دوباره تلاش کنید؛ اطلاعات ثبت‌شده شما حفظ شده است." retry={retry} digest={error.digest} /></body></html>;
}
