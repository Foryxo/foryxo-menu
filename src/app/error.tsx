"use client";
import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/error-state";
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div data-runtime-error="true"><ErrorState title="مشکلی پیش آمد · Something went wrong" body="این صفحه کامل بارگذاری نشد. دوباره تلاش کنید؛ داده‌های ثبت‌شده شما پاک نشده‌اند." retry={retry} digest={error.digest} /></div>;
}
