"use client";

import { useState } from "react";
import { Building2, Check, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import type { Locale } from "@/domains/i18n/config";

type Fulfillment = "dine_in" | "takeaway" | "delivery";
interface BranchForm {
  id?: string; name: string; address: string; city: string; province: string; phone: string; mapUrl: string;
  isPrimary: boolean; isActive: boolean; acceptsOrders: boolean; fulfillmentTypes: string[]; minimumOrder: number;
  orderContactPhone: string; notificationEmail: string; createdAt?: string; updatedAt?: string;
}

const emptyBranch: BranchForm = { name: "", address: "", city: "", province: "", phone: "", mapUrl: "", isPrimary: false, isActive: true, acceptsOrders: false, fulfillmentTypes: ["dine_in", "takeaway"], minimumOrder: 0, orderContactPhone: "", notificationEmail: "" };

export function BranchManager({ locale, businessId, initialBranches }: { locale: Locale; businessId: string; initialBranches: BranchForm[] }) {
  const fa = locale === "fa";
  const [branches, setBranches] = useState(initialBranches);
  const [adding, setAdding] = useState(initialBranches.length === 0);
  const [draft, setDraft] = useState<BranchForm>(emptyBranch);

  function replaceBranch(branch: BranchForm) {
    setBranches((current) => branch.id && current.some((item) => item.id === branch.id) ? current.map((item) => item.id === branch.id ? branch : item) : [...current, branch]);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm font-black accent-text">{fa ? "مدیریت چند شعبه" : "Multi-branch operations"}</p><h1 className="display-3 mt-1">{fa ? "شعبه‌ها و دریافت سفارش" : "Branches and order routing"}</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{fa ? "اطلاعات هر شعبه، روش‌های تحویل و دریافت سفارش را جداگانه تنظیم کنید. یک منوی مشترک می‌تواند سفارش را به شعبه انتخابی بفرستد؛ منوهای مستقل نیز مستقیماً به شعبه خود متصل می‌شوند." : "Configure each location, fulfillment methods, and order intake independently. A shared menu can route orders to the selected branch, while unique menus connect directly to their location."}</p></div>
        <Button onClick={() => { setDraft(emptyBranch); setAdding(true); }}><Plus className="size-4" />{fa ? "افزودن شعبه" : "Add branch"}</Button>
      </header>

      {adding ? <BranchEditor locale={locale} businessId={businessId} value={draft} onSaved={(branch) => { replaceBranch(branch); setAdding(false); }} onCancel={branches.length ? () => setAdding(false) : undefined} /> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {branches.map((branch) => <BranchEditor key={branch.id} locale={locale} businessId={businessId} value={branch} onSaved={replaceBranch} />)}
      </div>
    </div>
  );
}

function BranchEditor({ locale, businessId, value, onSaved, onCancel }: { locale: Locale; businessId: string; value: BranchForm; onSaved: (branch: BranchForm) => void; onCancel?: () => void }) {
  const fa = locale === "fa";
  const [form, setForm] = useState(value);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fulfillmentLabels: Record<Fulfillment, string> = { dine_in: fa ? "سرو در محل" : "Dine-in", takeaway: fa ? "بیرون‌بر" : "Pickup", delivery: fa ? "ارسال" : "Delivery" };
  const patch = (next: Partial<BranchForm>) => setForm((current) => ({ ...current, ...next }));

  async function save() {
    if (!form.name.trim() || (form.acceptsOrders && form.fulfillmentTypes.length === 0)) { setMessage(fa ? "نام شعبه و حداقل یک روش تحویل لازم است." : "Branch name and at least one fulfillment method are required."); return; }
    setBusy(true); setMessage(null);
    const res = await fetch("/api/branches", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, businessId }) }).catch(() => null);
    if (res?.ok) { const data = await res.json(); onSaved({ ...form, ...data.branch, fulfillmentTypes: data.branch.fulfillmentTypes ?? [] }); setMessage(fa ? "ذخیره شد." : "Saved."); }
    else setMessage(fa ? "ذخیره نشد؛ ورودی‌ها را بررسی کنید." : "Could not save; check the fields.");
    setBusy(false);
  }

  return (
    <section className="surface rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl accent-soft-bg accent-text"><Building2 className="size-5" /></span><div><h2 className="font-extrabold">{form.name || (fa ? "شعبه جدید" : "New branch")}</h2>{form.isPrimary ? <p className="text-xs font-bold accent-text">{fa ? "شعبه اصلی" : "Primary branch"}</p> : null}</div></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-muted">{fa ? "نام شعبه *" : "Branch name *"}<Input className="mt-1" value={form.name} onChange={(event) => patch({ name: event.target.value })} maxLength={100} /></label>
        <label className="text-xs font-bold text-muted">{fa ? "شهر" : "City"}<Input className="mt-1" value={form.city} onChange={(event) => patch({ city: event.target.value })} maxLength={80} /></label>
        <label className="text-xs font-bold text-muted sm:col-span-2">{fa ? "آدرس" : "Address"}<Input className="mt-1" value={form.address} onChange={(event) => patch({ address: event.target.value })} maxLength={500} /></label>
        <label className="text-xs font-bold text-muted">{fa ? "شماره عمومی" : "Public phone"}<Input className="mt-1" value={form.phone} onChange={(event) => patch({ phone: event.target.value })} inputMode="tel" dir="ltr" /></label>
        <label className="text-xs font-bold text-muted">{fa ? "لینک نقشه" : "Map link"}<Input className="mt-1" value={form.mapUrl} onChange={(event) => patch({ mapUrl: event.target.value })} type="url" dir="ltr" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Toggle checked={form.isActive} onChange={(checked) => patch({ isActive: checked })} label={fa ? "شعبه فعال" : "Active branch"} />
        <Toggle checked={form.isPrimary} onChange={(checked) => patch({ isPrimary: checked })} label={fa ? "شعبه اصلی" : "Primary branch"} />
        <Toggle checked={form.acceptsOrders} onChange={(checked) => patch({ acceptsOrders: checked })} label={fa ? "دریافت سفارش آنلاین" : "Accept online orders"} />
      </div>
      {form.acceptsOrders ? <div className="mt-4 rounded-xl bg-subtle p-4"><p className="text-xs font-black">{fa ? "روش‌های تحویل" : "Fulfillment"}</p><div className="mt-2 flex flex-wrap gap-2">{(Object.keys(fulfillmentLabels) as Fulfillment[]).map((type) => <Toggle key={type} checked={form.fulfillmentTypes.includes(type)} onChange={(checked) => patch({ fulfillmentTypes: checked ? [...form.fulfillmentTypes, type] : form.fulfillmentTypes.filter((item) => item !== type) })} label={fulfillmentLabels[type]} />)}</div><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-muted">{fa ? "شماره تماس سفارش" : "Order contact phone"}<Input className="mt-1" value={form.orderContactPhone} onChange={(event) => patch({ orderContactPhone: event.target.value })} inputMode="tel" dir="ltr" /></label><label className="text-xs font-bold text-muted">{fa ? "ایمیل اعلان" : "Alert email"}<Input className="mt-1" value={form.notificationEmail} onChange={(event) => patch({ notificationEmail: event.target.value })} type="email" dir="ltr" /></label><label className="text-xs font-bold text-muted">{fa ? "حداقل سفارش (تومان)" : "Minimum order (Toman)"}<Input className="mt-1" value={form.minimumOrder || ""} onChange={(event) => patch({ minimumOrder: Math.max(0, Number(event.target.value) || 0) })} type="number" inputMode="numeric" dir="ltr" /></label></div></div> : null}
      <div className="mt-4 flex items-center gap-2"><Button loading={busy} onClick={() => void save()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{fa ? "ذخیره شعبه" : "Save branch"}</Button>{onCancel ? <Button variant="ghost" onClick={onCancel}>{fa ? "انصراف" : "Cancel"}</Button> : null}{message ? <span className="text-xs font-bold text-muted" role="status">{message}</span> : null}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button type="button" aria-pressed={checked} onClick={() => onChange(!checked)} className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${checked ? "border-[var(--accent)] accent-bg" : "border-line bg-elevated hover:border-[var(--accent)]"}`}>{label}</button>;
}
