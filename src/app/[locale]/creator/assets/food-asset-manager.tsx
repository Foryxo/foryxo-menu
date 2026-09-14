"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Check, ExternalLink, ImageIcon, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/primitives";
import type { Locale } from "@/domains/i18n/config";

type WorkflowStatus = "received" | "editing" | "ready" | "placed" | "needs_info";

interface FoodAsset {
  id: string;
  businessId: string;
  businessName: string;
  label: string;
  filename: string;
  customerNotes: string | null;
  creatorNotes: string | null;
  workflowStatus: string;
  mime: string;
  size: number;
  url: string;
  uploader: string | null;
  createdAt: string;
}

const STATUSES: WorkflowStatus[] = ["received", "editing", "ready", "placed", "needs_info"];

export function FoodAssetManager({ locale, initialAssets }: { locale: Locale; initialAssets: FoodAsset[] }) {
  const fa = locale === "fa";
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WorkflowStatus>("all");
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusLabel = (status: string) => {
    const labels: Record<string, [string, string]> = {
      received: ["دریافت شده", "Received"],
      editing: ["در حال ویرایش", "Editing"],
      ready: ["آماده", "Ready"],
      placed: ["در منو قرار گرفت", "Placed in menu"],
      needs_info: ["نیازمند توضیح مشتری", "Needs customer info"],
    };
    return labels[status]?.[fa ? 0 : 1] ?? status;
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return assets.filter((asset) => {
      const matchesStatus = statusFilter === "all" || asset.workflowStatus === statusFilter;
      const haystack = `${asset.label} ${asset.filename} ${asset.businessName} ${asset.customerNotes ?? ""}`.toLocaleLowerCase(locale);
      return matchesStatus && (!needle || haystack.includes(needle));
    });
  }, [assets, locale, query, statusFilter]);

  function patchLocal(id: string, patch: Partial<FoodAsset>) {
    setAssets((current) => current.map((asset) => (asset.id === id ? { ...asset, ...patch } : asset)));
  }

  async function save(asset: FoodAsset) {
    setSaving(asset.id);
    setSaved(null);
    setError(null);
    try {
      const res = await fetch("/api/creator/assets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: asset.id,
          workflowStatus: asset.workflowStatus,
          creatorNotes: asset.creatorNotes ?? "",
        }),
      });
      if (!res.ok) throw new Error("save_failed");
      setSaved(asset.id);
    } catch {
      setError(fa ? "ذخیره وضعیت انجام نشد. دوباره تلاش کنید." : "Could not save the asset status. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-black accent-text">{fa ? "صف تولید تصاویر مشتری" : "Customer image production queue"}</p>
        <h1 className="display-3 mt-1">{fa ? "عکس‌های غذا برای ویرایش" : "Food photos to edit"}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
          {fa
            ? "هر تصویر با نام غذا و توضیح مشتری ثبت شده است. وضعیت و یادداشت داخلی را به‌روزرسانی کنید تا هیچ فایل یا اصلاحی گم نشود."
            : "Every image arrives with its dish name and customer instructions. Update its status and internal notes so no file or revision gets lost."}
        </p>
      </header>

      <div className="surface grid gap-3 rounded-2xl p-4 sm:grid-cols-[1fr_auto]">
        <label className="relative">
          <span className="sr-only">{fa ? "جستجو" : "Search"}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="ps-10" placeholder={fa ? "نام غذا، مشتری یا فایل…" : "Dish, client, or filename…"} />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | WorkflowStatus)}
          className="h-11 rounded-xl border border-line bg-elevated px-3 text-sm font-bold outline-none transition focus:border-[var(--accent)]"
          aria-label={fa ? "فیلتر وضعیت" : "Filter by status"}
        >
          <option value="all">{fa ? "همه وضعیت‌ها" : "All statuses"}</option>
          {STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
        </select>
      </div>

      {error ? <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-300" role="alert">{error}</p> : null}

      {filtered.length === 0 ? (
        <div className="surface rounded-2xl p-12 text-center">
          <ImageIcon className="mx-auto size-9 text-muted" aria-hidden="true" />
          <p className="mt-3 font-bold">{fa ? "هنوز تصویر غذایی در این صف نیست." : "There are no food photos in this queue yet."}</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((asset) => (
            <article key={asset.id} className="surface overflow-hidden rounded-2xl">
              <div className="grid sm:grid-cols-[180px_1fr]">
                <a href={asset.url} target="_blank" rel="noreferrer" className="group relative min-h-52 overflow-hidden bg-subtle sm:min-h-full" aria-label={fa ? `باز کردن تصویر ${asset.label}` : `Open ${asset.label} image`}>
                  <Image src={asset.url} alt={asset.label} fill unoptimized sizes="(max-width: 640px) 100vw, 180px" className="object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute end-2 top-2 grid size-9 place-items-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </span>
                </a>
                <div className="space-y-4 p-5">
                  <div>
                    <p className="text-xs font-black accent-text">{asset.businessName}</p>
                    <h2 className="mt-1 text-lg font-extrabold">{asset.label}</h2>
                    <p className="mt-1 break-all text-xs text-muted">{asset.filename} · {Math.max(1, Math.round(asset.size / 1024))} KB</p>
                  </div>
                  {asset.customerNotes ? (
                    <div className="rounded-xl bg-subtle p-3 text-sm leading-6">
                      <span className="block text-xs font-black text-muted">{fa ? "توضیح مشتری" : "Customer notes"}</span>
                      {asset.customerNotes}
                    </div>
                  ) : null}
                  <label className="block text-xs font-black text-muted">
                    {fa ? "وضعیت" : "Status"}
                    <select
                      value={asset.workflowStatus}
                      onChange={(event) => patchLocal(asset.id, { workflowStatus: event.target.value })}
                      className="mt-1 h-10 w-full rounded-xl border border-line bg-elevated px-3 text-sm font-bold text-fg outline-none transition focus:border-[var(--accent)]"
                    >
                      {STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-black text-muted">
                    {fa ? "یادداشت داخلی سازنده" : "Creator-only notes"}
                    <Textarea
                      value={asset.creatorNotes ?? ""}
                      onChange={(event) => patchLocal(asset.id, { creatorNotes: event.target.value })}
                      rows={2}
                      maxLength={1000}
                      className="mt-1"
                      placeholder={fa ? "مثلاً: پس‌زمینه حذف شود، نور گرم‌تر…" : "For example: remove background, warmer lighting…"}
                    />
                  </label>
                  <Button className="w-full" onClick={() => void save(asset)} disabled={saving === asset.id}>
                    {saving === asset.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : saved === asset.id ? <Check className="size-4" aria-hidden="true" /> : null}
                    {saving === asset.id ? (fa ? "در حال ذخیره…" : "Saving…") : saved === asset.id ? (fa ? "ذخیره شد" : "Saved") : (fa ? "ذخیره وضعیت" : "Save status")}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
