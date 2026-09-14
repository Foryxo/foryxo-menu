"use client";

/**
 * Build-a-menu wizard (spec §24): 10 steps, autosave per step change,
 * resumable (GET on mount), sticky estimate, auth at the final step.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field, Badge } from "@/components/ui/primitives";
import { demos } from "@/content/demos/index";
import { features as featureCatalog } from "@/content/features";
import { DemoPhone } from "@/components/site/demo-phone";
import { formatToman } from "@/domains/i18n/format";
import { toPersianDigits } from "@/domains/i18n/normalize";
import { EMPTY_CONFIG, TOTAL_STEPS, invalidBuilderSteps, type BuilderConfig } from "@/domains/builder/config";
import { calculateDeliveryEstimate } from "@/domains/builder/delivery";
import { catalogPrice } from "@/domains/pricing/calculator";
import { cn } from "@/lib/utils";
import type { Locale } from "@/domains/i18n/config";

type WizardLabels = Labels;

interface Labels {
  title: string; step: string; of: string;
  steps: {
    business: string; demo: string; style: string; language: string; features: string;
    content: string; domain: string; management: string; review: string; account: string;
  };
  businessType: Record<string, string>;
  chooseDemo: string; styleName: string; styleNameEn: string; styleColor: string;
  styleColorSecondary: string; styleMode: string; styleFont: string;
  styleFontFeel: Record<string, string>;
  languageFa: string; languageEn: string; languageFaEn: string; languageOther: string;
  featuresTitle: string; featuresIncluded: string; recommended: string;
  contentOptions: Record<string, string>;
  domainOptions: Record<string, string>;
  domainOwn: string; domainOwnHint: string; domainNoneHint: string; domainWebsiteHint: string;
  managementOptions: Record<string, string>; managementSelfHint: string; managementManagedHint: string;
  reviewTitle: string; estimateInitial: string; estimateRecurring: string; estimateNote: string;
  accountTitle: string; accountNote: string; submitProject: string;
  submitted: string; submittedBody: string; goToDashboard: string;
  progressSaved: string; summary: string; change: string;
  next: string; previous: string; login: string; toman: string; currencyNote: string; demo: string;
}

interface Estimate {
  lines: { key: string | null; amount: number; recurring: boolean }[];
  initialTotal: number;
  recurringAnnual: number;
}

const STEP_KEYS = ["business", "demo", "style", "language", "features", "content", "domain", "management", "review", "account"] as const;

export function BuilderWizard({ locale, presetDemo, labels: L }: { locale: Locale; presetDemo: string | null; labels: WizardLabels }) {
  const router = useRouter();
  const fa = locale === "fa";
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<BuilderConfig>(presetDemo ? { ...EMPTY_CONFIG, demoId: presetDemo } : EMPTY_CONFIG);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ projectId: string } | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"loading" | "saving" | "saved" | "error">("loading");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlight = useRef<Promise<void>>(Promise.resolve());
  const initialLoad = useRef(true);
  const stepHeadingRef = useRef<HTMLDivElement>(null);

  // Load persisted draft
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/builder/draft");
        if (!res.ok) throw new Error("Could not load builder draft");
        const data = await res.json();
        if (data.config) {
          setConfig({ ...data.config, ...(presetDemo ? { demoId: presetDemo } : {}) });
          setStep(Math.min(TOTAL_STEPS, Math.max(1, data.step ?? 1)));
        }
        if (data.estimate) setEstimate(data.estimate);
        const me = await fetch("/api/auth/get-session");
        setAuthed(me.ok ? Boolean((await me.json())?.user) : false);
      } catch {
        setAuthed(false);
        setSaveState("error");
      } finally {
        initialLoad.current = false;
        setSaveState((current) => current === "error" ? current : "saved");
      }
    })();
  }, [presetDemo]);

  // Debounced autosave whenever config/step changes
  useEffect(() => {
    if (initialLoad.current || submitted) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveInFlight.current = saveInFlight.current.then(async () => {
        const response = await fetch("/api/builder/draft", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step, config }),
        });
        if (!response.ok) throw new Error("draft_save_failed");
        const data = await response.json();
        if (data.estimate) setEstimate(data.estimate);
        setSaveState("saved");
      }).catch(() => setSaveState("error"));
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [config, step, submitted]);

  const patch = useCallback((p: Partial<BuilderConfig>) => setConfig((c) => ({ ...c, ...p })), []);

  const demo = useMemo(() => demos.find((d) => d.id === config.demoId), [config.demoId]);
  const delivery = useMemo(() => calculateDeliveryEstimate(config), [config]);
  const nd = (n: number | string) => (fa ? toPersianDigits(n) : String(n));

  useEffect(() => {
    stepHeadingRef.current?.focus();
    stepHeadingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const isStepValid = useCallback((value: number) => !invalidBuilderSteps(config).includes(value), [config]);

  const goNext = () => {
    if (!isStepValid(step)) {
      setStepError(fa ? "لطفاً این مرحله را کامل کنید." : "Please complete this step before continuing.");
      return;
    }
    setStepError(null);
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  async function submit() {
    setSubmitting(true);
    try {
      const invalidSteps = invalidBuilderSteps(config);
      if (invalidSteps.length) {
        setStep(invalidSteps[0]);
        setStepError(fa ? "لطفاً این مرحله را کامل کنید." : "Please complete this step before continuing.");
        return;
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      await saveInFlight.current;
      const save = await fetch("/api/builder/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, config }),
      });
      if (!save.ok) throw new Error("draft_save_failed");
      const res = await fetch("/api/builder/submit", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSubmitted({ projectId: data.projectId });
      } else if (res.status === 401) {
        router.push(`/${locale}/login?next=/${locale}/build`);
      } else {
        const body = await res.json().catch(() => ({}));
        if (Array.isArray(body.invalidSteps) && body.invalidSteps.length) setStep(body.invalidSteps[0]);
        throw new Error("submit_failed");
      }
    } catch {
      setStepError(fa ? "ثبت درخواست انجام نشد. لطفاً دوباره تلاش کنید." : "The request could not be submitted. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <span className="text-5xl" aria-hidden="true">🎉</span>
        <h1 className="display-2 mt-4">{L.submitted}</h1>
        <p className="mt-3 leading-7 text-muted">{L.submittedBody}</p>
        {config.contentOption === "photos" ? (
          <p className="mt-4 rounded-2xl bg-[var(--accent-soft)] p-4 text-sm font-semibold leading-6">
            {fa ? "مرحله بعد: عکس‌های غذا را چندتایی بارگذاری کنید و نام هر غذا و توضیح ویرایش را بنویسید." : "Next: upload your food photos in a batch and add each dish name and editing instructions."}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {config.contentOption === "photos" ? <Link href={`/${locale}/dashboard/files`} className="inline-flex h-12 items-center rounded-xl accent-bg px-8 text-sm font-bold">{fa ? "بارگذاری عکس‌های غذا" : "Upload food photos"}</Link> : null}
          <Link href={`/${locale}/dashboard`} className={`inline-flex h-12 items-center rounded-xl px-8 text-sm font-bold ${config.contentOption === "photos" ? "border border-line bg-elevated" : "accent-bg"}`}>
            {L.goToDashboard}
          </Link>
        </div>
      </div>
    );
  }

  if (saveState === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10" aria-busy="true">
        <h1 className="text-lg font-extrabold">{L.title}</h1>
        <div className="mt-8 h-1.5 animate-pulse rounded-full bg-subtle" />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-subtle" />)}
        </div>
        <p className="mt-4 text-sm text-muted" role="status">{fa ? "در حال بارگذاری تنظیمات منو…" : "Loading your menu setup…"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm">
          <h1 className="text-lg font-extrabold">{L.title}</h1>
          <span className="text-muted">
            {L.step} {nd(step)} {L.of} {nd(TOTAL_STEPS)} — {L.steps[STEP_KEYS[step - 1]]}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-label={fa ? "پیشرفت ساخت منو" : "Menu setup progress"} aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
          <div className="h-full rounded-full accent-bg transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted" role="status">
          {saveState === "saving"
            ? (fa ? "در حال ذخیره…" : "Saving…")
            : saveState === "error"
              ? (fa ? "ذخیره انجام نشد؛ دوباره تلاش می‌کنیم." : "Could not save; we will retry.")
              : L.progressSaved}
        </p>
        <p className="mt-2 text-xs font-semibold text-muted lg:hidden">{fa ? `زمان تقریبی اجرا: ${nd(delivery.minimumBusinessDays)} تا ${nd(delivery.maximumBusinessDays)} روز کاری، پس از دریافت محتوای کامل و تأیید پیش‌فاکتور` : `Estimated delivery: ${nd(delivery.minimumBusinessDays)}–${nd(delivery.maximumBusinessDays)} business days after complete content and quote approval`}</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <div ref={stepHeadingRef} tabIndex={-1} className="scroll-mt-24 outline-none">
          {step === 1 ? <StepBusiness config={config} patch={patch} L={L} /> : null}
          {step === 2 ? <StepDemo config={config} patch={patch} locale={locale} L={L} /> : null}
          {step === 3 ? <StepStyle config={config} patch={patch} locale={locale} L={L} /> : null}
          {step === 4 ? <StepLanguage config={config} patch={patch} L={L} /> : null}
          {step === 5 ? <StepFeatures config={config} patch={patch} locale={locale} L={L} /> : null}
          {step === 6 ? <StepContent config={config} patch={patch} locale={locale} L={L} /> : null}
          {step === 7 ? <StepDomain config={config} patch={patch} L={L} /> : null}
          {step === 8 ? <StepManagement config={config} patch={patch} L={L} /> : null}
          {step === 9 ? <StepReview config={config} estimate={estimate} delivery={delivery} locale={locale} L={L} onJump={(s) => setStep(s)} /> : null}
          {step === 10 ? (
            <div className="space-y-6">
              <h2 className="display-3">{L.accountTitle}</h2>
              <p className="text-sm text-muted">
                {authed
                  ? (fa ? "همه‌چیز آماده است؛ درخواست را ثبت کنید تا بررسی و قیمت نهایی شروع شود." : "Everything is ready. Submit the request to begin review and final pricing.")
                  : L.accountNote}
              </p>
              {authed === false ? (
                <Link href={`/${locale}/login?next=/${locale}/build`} className="inline-flex h-12 items-center rounded-xl accent-bg px-8 text-sm font-bold">
                  {L.login}
                </Link>
              ) : (
                <Button size="lg" loading={submitting} onClick={submit} disabled={!config.demoId || !config.businessType || !config.management}>
                  {L.submitProject}
                </Button>
              )}
            </div>
          ) : null}

          {/* Nav */}
          <div className="mt-10 flex items-center justify-between">
            <Button variant="secondary" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
              {L.previous}
            </Button>
            {step < TOTAL_STEPS ? (
              <Button onClick={goNext}>{L.next}</Button>
            ) : null}
          </div>
          {stepError ? <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400" role="alert">{stepError}</p> : null}
        </div>

        {/* Sticky summary */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {demo ? (
              <div className="surface rounded-2xl p-4">
                <div className="scale-[0.62] origin-top" aria-hidden="true">
                  <DemoPhone demo={demo} locale={locale} />
                </div>
                <div className="-mt-24" />
                <p className="text-center text-sm font-bold">{fa ? demo.nameFa : demo.name}</p>
              </div>
            ) : config.demoId === "custom" ? (
              <div className="surface rounded-2xl p-5 text-center">
                <p className="text-sm font-extrabold">{fa ? "طراحی اختصاصی" : "Custom design"}</p>
                <p className="mt-1 text-xs text-muted">{fa ? "بر اساس توضیحات و هویت برند شما" : "Built around your brief and brand"}</p>
              </div>
            ) : null}
            <div className="surface rounded-2xl p-5">
              <h3 className="text-sm font-extrabold">{L.estimateInitial}</h3>
              <p className="mt-1 text-2xl font-black accent-text">
                {estimate ? formatToman(estimate.initialTotal, locale) : "—"}
              </p>
              <h3 className="mt-4 text-sm font-extrabold">{L.estimateRecurring}</h3>
              <p className="mt-1 text-lg font-bold">
                {estimate ? formatToman(estimate.recurringAnnual, locale) : "—"}
              </p>
              <p className="mt-3 text-[11px] leading-5 text-muted">{L.estimateNote}</p>
              <p className="mt-3 border-t border-line pt-3 text-xs font-bold">{fa ? `زمان تقریبی اجرا: ${nd(delivery.minimumBusinessDays)} تا ${nd(delivery.maximumBusinessDays)} روز کاری` : `Estimated delivery: ${nd(delivery.minimumBusinessDays)}–${nd(delivery.maximumBusinessDays)} business days`}</p>
              <p className="mt-1 text-[11px] leading-5 text-muted">{fa ? "از زمان دریافت محتوای کامل و تأیید پیش‌فاکتور؛ تاریخ نهایی در پیشنهاد تأییدشده مشخص می‌شود." : "From complete content and quote approval; the confirmed quote sets the final date."}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------ Steps ------------------------------ */

function OptionCard({ selected, onClick, title, desc }: { selected: boolean; onClick: () => void; title: string; desc?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-2xl border p-4 text-start transition-all active:scale-[0.98]",
        selected ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]" : "border-line bg-elevated hover:bg-subtle",
      )}
    >
      <span className="block font-bold">{title}</span>
      {desc ? <span className="mt-1 block text-xs text-muted">{desc}</span> : null}
    </button>
  );
}

function StepBusiness({ config, patch, L }: { config: BuilderConfig; patch: (p: Partial<BuilderConfig>) => void; L: Labels }) {
  const types = Object.entries(L.businessType);
  return (
    <div>
      <h2 className="display-3">{L.steps.business}</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {types.map(([key, label]) => (
          <OptionCard key={key} title={label} selected={config.businessType === key} onClick={() => patch({ businessType: key as BuilderConfig["businessType"] })} />
        ))}
      </div>
    </div>
  );
}

function StepDemo({ config, patch, locale, L }: { config: BuilderConfig; patch: (p: Partial<BuilderConfig>) => void; locale: Locale; L: Labels }) {
  const fa = locale === "fa";
  const matching = config.businessType
    ? demos.filter((d) => {
        const map: Record<string, string[]> = {
          cafe: ["mora", "volt"], restaurant: ["atria", "noir"], cafe_restaurant: ["atria", "district"],
          fastfood: ["crush"], iranian: ["khesht"], bakery: ["miette"], brunch: ["sunday"],
          healthy: ["form"], foodhall: ["district"], other: [],
        };
        return (map[config.businessType!] ?? []).includes(d.id);
      })
    : [];
  const ordered = [...matching, ...demos.filter((d) => !matching.includes(d))];

  return (
    <div>
      <h2 className="display-3">{L.chooseDemo}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className={cn("flex min-h-72 flex-col justify-between rounded-3xl border p-6", config.demoId === "custom" ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]" : "border-line bg-elevated")}>
          <div>
            <span className="grid size-12 place-items-center rounded-2xl accent-bg text-2xl" aria-hidden="true">✦</span>
            <h3 className="mt-6 text-xl font-extrabold">{fa ? "طراحی اختصاصی برای من" : "Design it for me"}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {fa ? "به جای انتخاب قالب، حال‌وهوای برند و نمونه‌های موردعلاقه‌تان را بگویید تا طراحی از صفر انجام شود." : "Skip the template choice and share your brand, mood, and references for a bespoke direction."}
            </p>
          </div>
          <Button size="sm" variant={config.demoId === "custom" ? "primary" : "outline"} className="mt-5 w-full" onClick={() => patch({ demoId: "custom" })}>
            {config.demoId === "custom" ? (fa ? "انتخاب شد ✓" : "Selected ✓") : (fa ? "طراحی اختصاصی" : "Choose custom design")}
          </Button>
        </div>
        {ordered.map((d) => (
          <div key={d.id} className={cn("rounded-3xl p-4 transition-all", config.demoId === d.id ? "ring-2 ring-[var(--accent)] bg-[var(--accent-soft)]" : "border border-line")}>
            <div className="mx-auto h-56 w-40 overflow-hidden sm:h-[380px] sm:w-[216px]" aria-hidden="true">
              <div className="w-[240px] origin-top-left scale-[0.66] sm:scale-90">
                <DemoPhone demo={d} locale={locale} interactive={false} />
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="font-extrabold">{fa ? d.nameFa : d.name}</p>
              <p className="text-xs text-muted">{fa ? d.tagline.fa : d.tagline.en}</p>
              {matching.includes(d) ? (
                <Badge className="mt-2">{fa ? "مناسب کسب‌وکار شما" : "Fits your business"}</Badge>
              ) : null}
              <Button
                size="sm"
                variant={config.demoId === d.id ? "primary" : "outline"}
                className="mt-3 w-full"
                aria-label={`${config.demoId === d.id ? (fa ? "انتخاب شد" : "Selected") : L.chooseDemo}: ${fa ? d.nameFa : d.name}`}
                onClick={() => patch({ demoId: d.id })}
              >
                {config.demoId === d.id ? (fa ? "انتخاب شد ✓" : "Selected ✓") : L.chooseDemo}
              </Button>
              <Link href={`/menus/${d.id}/menu?lang=${locale}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-bold accent-text underline-offset-4 hover:underline">{fa ? "باز کردن منوی کامل" : "Open the full menu"}</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepStyle({ config, patch, locale, L }: { config: BuilderConfig; patch: (p: Partial<BuilderConfig>) => void; locale: Locale; L: Labels }) {
  const fa = locale === "fa";
  return (
    <div className="max-w-xl space-y-5">
      <h2 className="display-3">{L.steps.style}</h2>
      <Field label={L.styleName} htmlFor="builder-brand-name" required>
        <Input id="builder-brand-name" value={config.brandName ?? ""} onChange={(e) => patch({ brandName: e.target.value })} maxLength={80} />
      </Field>
      <Field label={L.styleNameEn} htmlFor="builder-brand-name-en">
        <Input id="builder-brand-name-en" value={config.brandNameEn ?? ""} onChange={(e) => patch({ brandNameEn: e.target.value })} maxLength={80} dir="ltr" />
      </Field>
      {config.demoId === "custom" ? (
        <>
          <Field label={fa ? "توضیح طراحی و حال‌وهوای برند" : "Design brief and brand mood"} htmlFor="builder-custom-brief" required>
            <Textarea id="builder-custom-brief" value={config.customBrief ?? ""} onChange={(e) => patch({ customBrief: e.target.value })} maxLength={2000} placeholder={fa ? "سبک دلخواه، رنگ‌ها، حس فضا، مخاطب و چیزهایی که دوست ندارید…" : "Desired style, colors, atmosphere, audience, and anything to avoid…"} />
          </Field>
          <Field label={fa ? "لینک نمونه‌ها" : "Reference links"} htmlFor="builder-reference-urls" hint={fa ? "هر لینک را در یک خط بنویسید." : "Put each URL on a new line."}>
            <Textarea id="builder-reference-urls" value={config.referenceUrls ?? ""} onChange={(e) => patch({ referenceUrls: e.target.value })} maxLength={1000} dir="ltr" placeholder="https://…" />
          </Field>
        </>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField key={`primary-${config.primaryColor}`} label={L.styleColor} value={config.primaryColor} fallback="#2347c8" onChange={(value) => patch({ primaryColor: value })} />
        <ColorField key={`secondary-${config.secondaryColor}`} label={L.styleColorSecondary} value={config.secondaryColor} fallback="#5b87fa" onChange={(value) => patch({ secondaryColor: value })} />
      </div>
      <Field label={L.styleMode}>
        <div className="grid grid-cols-3 gap-2">
          {(["system", "light", "dark"] as const).map((m) => (
            <OptionCard key={m} title={m === "system" ? (L.styleMode === "حالت رنگی منو" ? "سیستم" : "System") : m === "light" ? (L.styleMode === "حالت رنگی منو" ? "روشن" : "Light") : (L.styleMode === "حالت رنگی منو" ? "تیره" : "Dark")} selected={config.colorMode === m} onClick={() => patch({ colorMode: m })} />
          ))}
        </div>
      </Field>
      <Field label={L.styleFont}>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(L.styleFontFeel).map(([k, label]) => (
            <OptionCard key={k} title={label} selected={config.fontFeel === k} onClick={() => patch({ fontFeel: k as BuilderConfig["fontFeel"] })} />
          ))}
        </div>
      </Field>
    </div>
  );
}

function ColorField({ label, value, fallback, onChange }: { label: string; value: string | null | undefined; fallback: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value ?? "");
  const valid = !draft || /^#[0-9a-fA-F]{6}$/.test(draft);
  const commit = () => {
    if (valid && draft) onChange(draft);
    else setDraft(value ?? "");
  };
  return <Field label={label}>
    <div className="flex items-center gap-3">
      <input type="color" value={value ?? fallback} onChange={(event) => { setDraft(event.target.value); onChange(event.target.value); }} className="h-11 w-14 cursor-pointer rounded-lg border border-line" aria-label={`${label} picker`} />
      <Input value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} placeholder={fallback} dir="ltr" maxLength={7} aria-label={`${label} HEX`} aria-invalid={!valid} />
    </div>
    {!valid ? <p className="mt-1 text-xs text-red-600" role="alert">{label}: #RRGGBB</p> : null}
  </Field>;
}

function StepLanguage({ config, patch, L }: { config: BuilderConfig; patch: (p: Partial<BuilderConfig>) => void; L: Labels }) {
  const has = (l: "fa" | "en" | "other") => config.languages.includes(l);
  return (
    <div>
      <h2 className="display-3">{L.steps.language}</h2>
      <div className="mt-6 grid max-w-xl gap-3">
        <OptionCard
          title={L.languageFa}
          desc={L.featuresIncluded}
          selected={has("fa")}
          onClick={() => patch({ languages: has("fa") ? config.languages.filter((x) => x !== "fa") : [...config.languages, "fa" as const] })}
        />
        <OptionCard
          title={L.languageEn}
          selected={has("en")}
          onClick={() => patch({ languages: has("en") ? config.languages.filter((x) => x !== "en") : [...config.languages, "en" as const] })}
        />
        <OptionCard
          title={L.languageOther}
          selected={has("other")}
          onClick={() => patch({ languages: has("other") ? config.languages.filter((x) => x !== "other") : [...config.languages, "other" as const], additionalLanguageCount: has("other") ? 0 : Math.max(1, config.additionalLanguageCount) })}
        />
        {has("other") ? (
          <Field label={L.languageOther} htmlFor="builder-extra-language-count" hint={`${formatToman(catalogPrice("addon.language").default, "fa")} ${L.toman} / ${L.languageOther}`}>
            <Input id="builder-extra-language-count" type="number" min={1} max={8} value={config.additionalLanguageCount || 1} onChange={(e) => patch({ additionalLanguageCount: Math.max(1, Math.min(8, Number(e.target.value) || 1)) })} dir="ltr" />
          </Field>
        ) : null}
      </div>
    </div>
  );
}

function StepFeatures({ config, patch, locale, L }: { config: BuilderConfig; patch: (p: Partial<BuilderConfig>) => void; locale: Locale; L: Labels }) {
  const fa = locale === "fa";
  const toggle = (key: string) => {
    const selected = config.features.includes(key);
    const next = new Set(config.features);
    if (selected) {
      next.delete(key);
      let changed = true;
      while (changed) {
        changed = false;
        for (const feature of featureCatalog) {
          if (next.has(feature.key) && feature.requires?.some((required) => !next.has(required))) {
            next.delete(feature.key);
            changed = true;
          }
        }
      }
    } else {
      const addWithDependencies = (featureKey: string) => {
        if (next.has(featureKey)) return;
        for (const required of featureCatalog.find((feature) => feature.key === featureKey)?.requires ?? []) addWithDependencies(required);
        next.add(featureKey);
      };
      addWithDependencies(key);
    }
    const nextFeatures = [...next];
    patch({
      features: nextFeatures,
      ...(key === "table_qr" ? { qrTableCount: selected ? 0 : Math.max(1, config.qrTableCount || 1) } : {}),
      ...(key === "multiple_branches" ? { branchCount: selected ? 1 : Math.max(2, config.branchCount || 2), branchMenuMode: selected ? "shared" as const : config.branchMenuMode } : {}),
    });
  };
  return (
    <div>
      <h2 className="display-3">{L.featuresTitle}</h2>
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
        <p className="font-extrabold">{fa ? "QR دائمی اصلی منو رایگان است" : "Your permanent main-menu QR is included"}</p>
        <p className="mt-1 leading-6 opacity-80">
          {fa
            ? "این کد همیشه مهمان را مستقیم به آدرس menu.foryxo.com/menus/نام-کافه/menu می‌برد. QR هر میز فقط وقتی لازم است که سفارش، درخواست گارسون یا گزارش خدمات باید شماره میز را خودکار بداند؛ برای یک منوی ساده همان QR اصلی کافی است."
            : "It always opens menu.foryxo.com/menus/your-cafe/menu. Per-table QR codes are only needed when ordering, waiter calls, or service analytics must know the table automatically; one main QR is enough for a simple menu."}
        </p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {featureCatalog.filter((f) => !["custom_domain", "custom_design", "managed_editing"].includes(f.key)).map((f) => (
          <OptionCard
            key={f.key}
            title={locale === "fa" ? f.fa : f.en}
            desc={f.priceKey ? (locale === "fa" ? f.faDesc : f.enDesc) : `${locale === "fa" ? f.faDesc : f.enDesc} · ${L.featuresIncluded}`}
            selected={config.features.includes(f.key)}
            onClick={() => toggle(f.key)}
          />
        ))}
      </div>
      {config.features.includes("table_qr") ? (
        <div className="mt-5 max-w-xl rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-5">
          <Field
            label={fa ? "چند میز QR اختصاصی نیاز دارد؟" : "How many tables need their own QR?"}
            htmlFor="builder-qr-table-count"
            hint={fa
              ? `هر میز ${formatToman(catalogPrice("addon.table_qr").default, locale)}؛ فایل QR دائمی و آماده چاپ تحویل می‌شود.`
              : `${formatToman(catalogPrice("addon.table_qr").default, locale)} per table; each permanent, print-ready QR is delivered separately.`}
            required
          >
            <Input
              id="builder-qr-table-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              value={config.qrTableCount || 1}
              onChange={(e) => patch({ qrTableCount: Math.max(1, Math.min(500, Number(e.target.value) || 1)) })}
              dir="ltr"
            />
          </Field>
          <p className="mt-3 text-sm font-extrabold accent-text">
            {fa ? "هزینه QR میزها: " : "Table QR total: "}
            {formatToman(catalogPrice("addon.table_qr").default * Math.max(1, config.qrTableCount || 1), locale)}
          </p>
        </div>
      ) : null}
      {config.features.includes("multiple_branches") ? (
        <div className="mt-5 max-w-2xl space-y-5 rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-5">
          <div>
            <h3 className="font-extrabold">{fa ? "ساختار شعبه‌ها" : "Branch setup"}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{fa ? "یک شعبه در پکیج اصلی است. برای هر شعبه آدرس، شماره تماس، حداقل سفارش، روش‌های تحویل و وضعیت دریافت سفارش جداگانه ثبت می‌شود." : "One location is included. Every branch gets its own address, contact number, minimum order, fulfillment methods, and ordering status."}</p>
          </div>
          <Field label={fa ? "تعداد کل شعبه‌ها" : "Total number of branches"} htmlFor="builder-branch-count" hint={fa ? `هر شعبه اضافه ${formatToman(catalogPrice("addon.branch").default, locale)}` : `${formatToman(catalogPrice("addon.branch").default, locale)} per additional branch`} required>
            <Input id="builder-branch-count" type="number" inputMode="numeric" min={2} max={50} value={config.branchCount || 2} onChange={(event) => patch({ branchCount: Math.max(2, Math.min(50, Number(event.target.value) || 2)) })} dir="ltr" />
          </Field>
          <fieldset>
            <legend className="text-sm font-bold">{fa ? "منوی شعبه‌ها چگونه باشد؟" : "How should branch menus work?"}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {([
                ["shared", fa ? "یک منوی مشترک" : "One shared menu", fa ? "همه شعبه‌ها آیتم و قیمت یکسان دارند" : "Same items and prices everywhere"],
                ["unique", fa ? "منوی جدا برای هر شعبه" : "A unique menu per branch", fa ? "آیتم، قیمت و موجودی هر شعبه مستقل است" : "Independent items, prices, and stock"],
                ["mixed", fa ? "ترکیبی" : "Mixed", fa ? "منوی پایه مشترک با تفاوت‌های شعبه‌ای" : "Shared base with branch overrides"],
              ] as const).map(([value, title, desc]) => <OptionCard key={value} title={title} desc={desc} selected={config.branchMenuMode === value} onClick={() => patch({ branchMenuMode: value })} />)}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-bold">{fa ? "مهمان چگونه شعبه را انتخاب کند؟" : "How should guests choose a branch?"}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                ["customer", fa ? "انتخاب دستی" : "Choose manually"],
                ["qr", fa ? "QR اختصاصی شعبه" : "Branch-specific QR"],
              ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={config.branchSelectionMode === value} onClick={() => patch({ branchSelectionMode: value })} className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${config.branchSelectionMode === value ? "border-[var(--accent)] accent-bg" : "border-line bg-elevated hover:border-[var(--accent)]"}`}>{label}</button>)}
            </div>
          </fieldset>
          <p className="text-sm font-extrabold accent-text">{fa ? "برآورد راه‌اندازی شعبه‌ها: " : "Estimated branch setup: "}{formatToman(catalogPrice("addon.branch").default * Math.max(1, (config.branchCount || 2) - 1) + (config.branchMenuMode === "shared" ? 0 : catalogPrice("addon.branch_unique_menu").default * Math.max(1, (config.branchCount || 2) - 1)), locale)}</p>
        </div>
      ) : null}
      {config.features.includes("direct_order") ? (
        <div className="mt-5 max-w-2xl space-y-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-50">
          <div>
            <h3 className="font-extrabold">{fa ? "دریافت سفارش در پنل رستوران" : "Receive orders in the restaurant dashboard"}</h3>
            <p className="mt-1 text-sm leading-6 opacity-80">{fa ? "سفارش جدید فوراً در صفحه سفارش‌ها نمایش داده می‌شود. کارکنان می‌توانند آن را بپذیرند، در حال آماده‌سازی بزنند، آماده/تحویل‌شده کنند، رد کنند و با مشتری تماس یا واتساپ بگیرند." : "New orders appear in the order inbox. Staff can accept, prepare, mark ready/completed, reject, and contact the customer by phone or WhatsApp."}</p>
          </div>
          <fieldset>
            <legend className="text-sm font-bold">{fa ? "روش‌های تحویل" : "Fulfillment methods"}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {([['dine_in', fa ? 'سرو در محل' : 'Dine-in'], ['takeaway', fa ? 'بیرون‌بر' : 'Pickup'], ['delivery', fa ? 'ارسال' : 'Delivery']] as const).map(([value, label]) => {
                const selected = config.fulfillmentTypes.includes(value);
                return <button key={value} type="button" aria-pressed={selected} onClick={() => patch({ fulfillmentTypes: selected ? config.fulfillmentTypes.filter((item) => item !== value) : [...config.fulfillmentTypes, value] })} className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${selected ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-300 bg-white/60 hover:bg-white dark:bg-black/20"}`}>{label}</button>;
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-bold">{fa ? "اعلان سفارش جدید" : "New-order alerts"}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {([['dashboard', fa ? 'داخل پنل' : 'Dashboard'], ['browser', fa ? 'اعلان مرورگر + صدا' : 'Browser + sound'], ['email', fa ? 'ایمیل' : 'Email'], ['sms', fa ? 'پیامک' : 'SMS']] as const).map(([value, label]) => {
                const selected = config.orderNotificationChannels.includes(value);
                return <button key={value} type="button" aria-pressed={selected} onClick={() => patch({ orderNotificationChannels: selected ? config.orderNotificationChannels.filter((item) => item !== value) : [...config.orderNotificationChannels, value] })} className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${selected ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-300 bg-white/60 hover:bg-white dark:bg-black/20"}`}>{label}</button>;
              })}
            </div>
          </fieldset>
          <p className="text-xs leading-5 opacity-75">{fa ? "اعلان داخل پنل استاندارد این قابلیت است. ایمیل و پیامک به تنظیم سرویس ارسال نیاز دارند؛ هیچ سفارشی فقط به اعلان مرورگر وابسته نمی‌ماند." : "Dashboard delivery is the reliable default. Email and SMS require their providers to be configured; orders never depend on a browser notification alone."}</p>
        </div>
      ) : null}
    </div>
  );
}

function StepContent({ config, patch, locale, L }: { config: BuilderConfig; patch: (p: Partial<BuilderConfig>) => void; locale: Locale; L: Labels }) {
  const fa = locale === "fa";
  const descriptions: Record<string, string> = {
    manual: fa ? "بعد از ثبت سفارش، آیتم‌ها را در پنل خودتان وارد می‌کنید." : "Enter your items yourself from the dashboard after submitting.",
    spreadsheet: fa ? "فایل اکسل یا CSV را چندتایی از پنل پروژه بارگذاری کنید." : "Upload one or more Excel or CSV files from your project dashboard.",
    pdf: fa ? "منوی فعلی را به صورت PDF می‌فرستید تا اطلاعات از آن استخراج شود." : "Send the current PDF menu so its content can be prepared.",
    photos: fa ? "عکس‌های واقعی غذا را چندتایی و با نام هر غذا می‌فرستید؛ فوریکسو آن‌ها را ویرایش و در منو قرار می‌دهد." : "Send real food photos in a named batch; Foryxo edits and places them on the correct menu items.",
    later: fa ? "اکنون سفارش را ثبت کنید و محتوا را بعداً در پنل پروژه بفرستید." : "Submit now and send the content later from your project dashboard.",
    full_service: fa ? "نام، قیمت و توضیحات را می‌فرستید و فوریکسو ورود کامل منو را انجام می‌دهد." : "Send the names, prices, and details and Foryxo handles complete menu entry.",
  };
  return (
    <div>
      <h2 className="display-3">{L.steps.content}</h2>
      <div className="mt-6 grid max-w-xl gap-3">
        {Object.entries(L.contentOptions).map(([key, label]) => (
          <OptionCard
            key={key}
            title={label}
            desc={descriptions[key]}
            selected={config.contentOption === key}
            onClick={() => patch({ contentOption: key as BuilderConfig["contentOption"], photoCount: key === "photos" ? Math.max(1, config.photoCount || 1) : null, itemCount: key === "full_service" ? Math.max(1, config.itemCount || 40) : null })}
          />
        ))}
      </div>
      {config.contentOption === "photos" ? (
        <div className="mt-5 max-w-xl rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-5">
          <Field
            label={fa ? "حدوداً چند عکس غذا برای ویرایش می‌فرستید؟" : "Approximately how many food photos will you send for editing?"}
            htmlFor="builder-food-photo-count"
            hint={fa
              ? `هزینه پایه هر تصویر ${formatToman(catalogPrice("content.image_cleanup").default, locale)} است؛ ویرایش سنگین قبل از شروع با شما تأیید می‌شود.`
              : `The base rate is ${formatToman(catalogPrice("content.image_cleanup").default, locale)} per image; heavier edits are confirmed with you before work begins.`}
            required
          >
            <Input id="builder-food-photo-count" type="number" inputMode="numeric" min={1} max={200} value={config.photoCount || 1} onChange={(event) => patch({ photoCount: Math.max(1, Math.min(200, Number(event.target.value) || 1)) })} dir="ltr" />
          </Field>
          <p className="mt-3 text-sm font-extrabold accent-text">
            {fa ? "برآورد ویرایش تصاویر: " : "Estimated image editing: "}
            {formatToman(catalogPrice("content.image_cleanup").default * Math.max(1, config.photoCount || 1), locale)}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">{fa ? "پس از ثبت درخواست، صفحه بارگذاری چندتایی باز می‌شود؛ نام غذا و توضیح جداگانه برای هر عکس ثبت خواهد شد." : "After submission, use the batch uploader to add a dish name and separate instructions to every photo."}</p>
        </div>
      ) : null}
      {config.contentOption === "full_service" ? <div className="mt-5 max-w-xl rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-5">
        <Field label={fa ? "حدوداً چند آیتم در منو دارید؟" : "Approximately how many menu items?"} htmlFor="builder-item-count" required>
          <Input id="builder-item-count" type="number" inputMode="numeric" min={1} max={500} value={config.itemCount || 40} onChange={(event) => patch({ itemCount: Math.max(1, Math.min(500, Number(event.target.value) || 1)) })} dir="ltr" />
        </Field>
      </div> : null}
    </div>
  );
}

function StepDomain({ config, patch, L }: { config: BuilderConfig; patch: (p: Partial<BuilderConfig>) => void; L: Labels }) {
  const hints: Record<string, string> = {
    own: L.domainOwnHint,
    help: L.domainOwnHint,
    none: L.domainNoneHint,
    website: L.domainWebsiteHint,
  };
  return (
    <div>
      <h2 className="display-3">{L.steps.domain}</h2>
      <div className="mt-6 grid max-w-xl gap-3">
        {Object.entries(L.domainOptions).map(([key, label]) => (
          <OptionCard key={key} title={label} desc={hints[key]} selected={config.domainOption === key} onClick={() => patch({ domainOption: key as BuilderConfig["domainOption"] })} />
        ))}
      </div>
      {config.domainOption === "own" || config.domainOption === "help" ? (
        <div className="mt-5 max-w-xl">
          <Field label={L.domainOwn} hint={L.domainOwnHint}>
            <Input value={config.domainName ?? ""} onChange={(e) => patch({ domainName: e.target.value })} dir="ltr" placeholder="menu.mycafe.ir" maxLength={100} />
          </Field>
        </div>
      ) : null}
    </div>
  );
}

function StepManagement({ config, patch, L }: { config: BuilderConfig; patch: (p: Partial<BuilderConfig>) => void; L: Labels }) {
  const hints: Record<string, string> = {
    self: L.managementSelfHint,
    managed: L.managementManagedHint,
    hybrid: L.managementManagedHint,
  };
  return (
    <div>
      <h2 className="display-3">{L.steps.management}</h2>
      <div className="mt-6 grid max-w-xl gap-3">
        {Object.entries(L.managementOptions).map(([key, label]) => (
          <OptionCard key={key} title={label} desc={hints[key]} selected={config.management === key} onClick={() => patch({ management: key as BuilderConfig["management"] })} />
        ))}
      </div>
    </div>
  );
}

function StepReview({
  config, estimate, delivery, locale, L, onJump,
}: {
  config: BuilderConfig; estimate: Estimate | null; delivery: ReturnType<typeof calculateDeliveryEstimate>; locale: Locale; L: Labels; onJump: (step: number) => void;
}) {
  const fa = locale === "fa";
  const demo = demos.find((d) => d.id === config.demoId);
  const rows: { label: string; value: string; step: number }[] = [
    { label: L.steps.business, value: config.businessType ? L.businessType[config.businessType] : "—", step: 1 },
    { label: L.steps.demo, value: demo ? (fa ? demo.nameFa : demo.name) : config.demoId === "custom" ? (fa ? "طراحی اختصاصی" : "Custom design") : "—", step: 2 },
    { label: L.steps.style, value: config.brandName || "—", step: 3 },
    { label: L.steps.language, value: config.languages.map((l) => (l === "fa" ? L.languageFa : l === "en" ? L.languageEn : L.languageOther)).join(" + ") || "—", step: 4 },
    {
      label: L.steps.features,
      value: [
        String(config.features.length),
        config.features.includes("table_qr") ? (fa ? `${config.qrTableCount} کد QR میز` : `${config.qrTableCount} table QR codes`) : null,
        config.features.includes("multiple_branches") ? (fa ? `${config.branchCount} شعبه · ${config.branchMenuMode === "shared" ? "منوی مشترک" : config.branchMenuMode === "unique" ? "منوهای مستقل" : "ترکیبی"}` : `${config.branchCount} branches · ${config.branchMenuMode} menus`) : null,
        config.features.includes("direct_order") ? (fa ? `سفارش آنلاین: ${config.fulfillmentTypes.length} روش تحویل` : `Online ordering: ${config.fulfillmentTypes.length} fulfillment methods`) : null,
      ].filter(Boolean).join(" · "),
      step: 5,
    },
    {
      label: L.steps.content,
      value: config.contentOption
        ? `${L.contentOptions[config.contentOption]}${config.contentOption === "photos" ? ` · ${config.photoCount || 0} ${fa ? "تصویر" : "photos"}` : ""}`
        : "—",
      step: 6,
    },
    { label: L.steps.domain, value: config.domainOption ? L.domainOptions[config.domainOption] : "—", step: 7 },
    { label: L.steps.management, value: config.management ? L.managementOptions[config.management] : "—", step: 8 },
  ];
  return (
    <div>
      <h2 className="display-3">{L.reviewTitle}</h2>
      <div className="mt-6 overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-semibold text-muted">{r.label}</td>
                <td className="px-4 py-3">{r.value}</td>
                <td className="px-4 py-3 text-end">
                  <button type="button" onClick={() => onJump(r.step)} className="text-xs font-bold accent-text hover:underline">
                    {L.change}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 rounded-2xl bg-[var(--accent-soft)] p-6">
        <div className="flex items-baseline justify-between">
          <span className="font-bold">{L.estimateInitial}</span>
          <span className="text-2xl font-black accent-text">{estimate ? formatToman(estimate.initialTotal, locale) : "—"}</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-sm text-muted">{L.estimateRecurring}</span>
          <span className="font-bold">{estimate ? formatToman(estimate.recurringAnnual, locale) : "—"}</span>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">{L.estimateNote}</p>
        <p className="mt-4 border-t border-line pt-3 text-sm font-extrabold">{fa ? `زمان تقریبی اجرا: ${toPersianDigits(delivery.minimumBusinessDays)} تا ${toPersianDigits(delivery.maximumBusinessDays)} روز کاری` : `Estimated delivery: ${delivery.minimumBusinessDays}–${delivery.maximumBusinessDays} business days`}</p>
        <p className="mt-1 text-xs leading-5 text-muted">{fa ? "زمان از دریافت محتوای کامل و تأیید پیش‌فاکتور محاسبه می‌شود؛ تاریخ قطعی در پیشنهاد نهایی خواهد بود." : "This starts after complete content and quote approval; the final date is confirmed in your quote."}</p>
      </div>
    </div>
  );
}
