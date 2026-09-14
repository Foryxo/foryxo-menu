import { PageShell } from "./page-shell";

export interface LegalSection {
  h: string;
  p: string;
}

export function LegalBody({
  title,
  intro,
  sections,
  warning,
  updatedFa,
  updatedEn,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  warning: string;
  updatedFa: string;
  updatedEn: string;
}) {
  const updated = new Date("2026-09-10");
  return (
    <section className="mx-auto max-w-3xl px-4 pb-20 pt-12">
      <h1 className="display-1">{title}</h1>
      <p className="lede mt-3">{intro}</p>
      <p className="mt-2 text-xs text-muted">
        {updatedFa}
        {new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "long" }).format(updated)} /{" "}
        {updatedEn}
        {new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(updated)}
      </p>
      <div className="mt-10 space-y-4">
        {sections.map((s) => (
          <div key={s.h} className="surface rounded-2xl p-6">
            <h2 className="font-extrabold">{s.h}</h2>
            <p className="mt-2 text-sm leading-7 whitespace-pre-line text-muted">{s.p}</p>
          </div>
        ))}
      </div>
      <p className="mt-10 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        ⚠ {warning}
      </p>
    </section>
  );
}

export async function LegalShell({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const l = locale === "en" ? "en" : "fa";
  return <PageShell locale={l}>{children}</PageShell>;
}
