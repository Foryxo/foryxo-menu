import { BrandMark } from "@/components/brand/brand-mark";

export function BrandLoader({ label = "Loading", fullPage = false }: { label?: string; fullPage?: boolean }) {
  return (
    <div className={fullPage ? "grid min-h-[55dvh] place-items-center px-4" : "grid min-h-48 place-items-center px-4"} role="status" aria-live="polite" aria-label={label}>
      <div className="flex flex-col items-center gap-4">
        <div className="brand-loader-mark relative grid size-24 place-items-center rounded-[2rem] border border-line bg-elevated shadow-[var(--shadow-pop)]">
          <span className="brand-loader-ring absolute inset-2 rounded-[1.55rem] border-2 border-transparent border-t-[var(--accent)]" aria-hidden="true" />
          <BrandMark size={70} className="brand-loader-logo" priority />
        </div>
        <span className="text-sm font-bold text-muted">{label}</span>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12" aria-hidden="true">
      <div className="skeleton h-5 w-32" />
      <div className="skeleton mt-5 h-12 max-w-xl" />
      <div className="skeleton mt-3 h-5 max-w-2xl" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="surface rounded-2xl p-4">
            <div className="skeleton aspect-[4/3] w-full rounded-xl" />
            <div className="skeleton mt-4 h-5 w-2/3" />
            <div className="skeleton mt-3 h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
