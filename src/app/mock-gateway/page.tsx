import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { flags, isProd } from "@/config/env";
import { formatToman } from "@/domains/i18n/format";

export const metadata: Metadata = {
  title: "Development payment simulator",
  robots: { index: false, follow: false },
};

export default async function MockGatewayPage({
  searchParams,
}: {
  searchParams: Promise<{ authority?: string; amount?: string; paymentId?: string }>;
}) {
  if (isProd || !flags.mockPayments) notFound();
  const { authority, amount, paymentId } = await searchParams;
  const parsedAmount = Number(amount);
  if (!authority?.startsWith("MOCK-") || !paymentId || !Number.isInteger(parsedAmount) || parsedAmount <= 0) {
    notFound();
  }
  const callback = `/api/payments/callback?paymentId=${encodeURIComponent(paymentId)}&authority=${encodeURIComponent(authority)}`;

  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-app px-4 py-12" dir="ltr">
      <section className="surface w-full max-w-md rounded-3xl p-7 text-center shadow-[var(--shadow-pop)]">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl accent-soft-bg text-2xl" aria-hidden="true">🧪</span>
        <h1 className="mt-4 text-2xl font-black">Development payment simulator</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          This page is only for local testing. No real card is charged.
        </p>
        <div className="mt-6 rounded-2xl bg-subtle p-4">
          <p className="text-xs text-muted">Amount</p>
          <p className="mt-1 text-xl font-black accent-text">{formatToman(parsedAmount, "en")}</p>
          <p className="mt-2 truncate text-xs text-muted" title={authority}>{authority}</p>
        </div>
        <div className="mt-6 grid gap-3">
          <Link href={`${callback}&Status=OK`} className="flex h-12 items-center justify-center rounded-xl accent-bg text-sm font-extrabold">
            Simulate successful payment
          </Link>
          <Link href={`${callback}&Status=NOK`} className="flex h-12 items-center justify-center rounded-xl border border-line text-sm font-bold hover:bg-subtle">
            Cancel payment
          </Link>
        </div>
      </section>
    </main>
  );
}
