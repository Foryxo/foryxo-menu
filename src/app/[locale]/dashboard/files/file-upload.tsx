"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Check, FileSpreadsheet, ImagePlus, Loader2, RotateCcw, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/primitives";
import type { Locale } from "@/domains/i18n/config";

interface Labels { upload: string; dragDrop: string; error: string }
type QueueStatus = "ready" | "uploading" | "done" | "error";
interface QueuedPhoto {
  id: string; file: File; previewUrl: string; label: string; notes: string; status: QueueStatus; error?: string;
}

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const MAX_PHOTOS = 30;
const MAX_BYTES = 25 * 1024 * 1024;

function inferredDishName(filename: string) {
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

export function FileUpload({ businessId, locale, labels: L }: { businessId: string; locale: Locale; labels: Labels }) {
  const router = useRouter();
  const fa = locale === "fa";
  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<QueuedPhoto[]>([]);
  const [queue, setQueue] = useState<QueuedPhoto[]>([]);
  const [dragging, setDragging] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [documentState, setDocumentState] = useState<"idle" | "uploading" | "done" | "error">("idle");

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => () => queueRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)), []);

  const pendingCount = queue.filter((item) => item.status !== "done").length;
  const invalidCount = queue.filter((item) => !item.label.trim()).length;
  const uploading = queue.some((item) => item.status === "uploading");
  const completedCount = queue.filter((item) => item.status === "done").length;
  const totalLabel = useMemo(() => fa ? `${queue.length} تصویر انتخاب شده` : `${queue.length} photo${queue.length === 1 ? "" : "s"} selected`, [fa, queue.length]);

  function addPhotos(files: FileList | File[]) {
    setBatchError(null);
    const existing = new Set(queue.map((item) => `${item.file.name}:${item.file.size}:${item.file.lastModified}`));
    const accepted: QueuedPhoto[] = [];
    let rejected = false;
    for (const file of Array.from(files)) {
      const fingerprint = `${file.name}:${file.size}:${file.lastModified}`;
      if (existing.has(fingerprint)) continue;
      if (!PHOTO_TYPES.has(file.type) || file.size > MAX_BYTES || queue.length + accepted.length >= MAX_PHOTOS) {
        rejected = true;
        continue;
      }
      existing.add(fingerprint);
      accepted.push({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file), label: inferredDishName(file.name), notes: "", status: "ready" });
    }
    setQueue((current) => [...current, ...accepted]);
    if (rejected) setBatchError(fa
      ? "بعضی فایل‌ها اضافه نشدند. فقط JPG، PNG، WebP، AVIF یا GIF تا ۲۵ مگابایت و حداکثر ۳۰ تصویر در هر نوبت مجاز است."
      : "Some files were skipped. Use JPG, PNG, WebP, AVIF, or GIF up to 25 MB, with at most 30 photos per batch.");
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function patchItem(id: string, patch: Partial<QueuedPhoto>) {
    setQueue((current) => current.map((item) => item.id === id ? { ...item, ...patch, status: item.status === "done" ? "done" : "ready", error: undefined } : item));
  }

  function removeItem(id: string) {
    setQueue((current) => {
      const found = current.find((item) => item.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  async function uploadPhoto(item: QueuedPhoto) {
    setQueue((current) => current.map((row) => row.id === item.id ? { ...row, status: "uploading", error: undefined } : row));
    const fd = new FormData();
    fd.set("file", item.file);
    fd.set("businessId", businessId);
    fd.set("kind", "food_photo");
    fd.set("label", item.label.trim());
    fd.set("customerNotes", item.notes.trim());
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : L.error);
      }
      setQueue((current) => current.map((row) => row.id === item.id ? { ...row, status: "done", error: undefined } : row));
      return true;
    } catch (error) {
      setQueue((current) => current.map((row) => row.id === item.id ? { ...row, status: "error", error: error instanceof Error ? error.message : L.error } : row));
      return false;
    }
  }

  async function uploadBatch() {
    setBatchError(null);
    if (invalidCount) {
      setBatchError(fa ? "برای هر تصویر نام غذا یا محصول را وارد کنید." : "Enter a dish or product name for every photo.");
      return;
    }
    let success = 0;
    for (const item of queue.filter((entry) => entry.status !== "done")) {
      if (await uploadPhoto(item)) success += 1;
    }
    if (success) router.refresh();
  }

  async function uploadDocuments(files: FileList) {
    setDocumentState("uploading");
    setBatchError(null);
    let failed = false;
    for (const file of Array.from(files).slice(0, 10)) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("businessId", businessId);
      fd.set("kind", /csv|excel|spreadsheet/.test(file.type) || /\.(csv|xlsx?|xls)$/i.test(file.name) ? "spreadsheet" : "menu_doc");
      fd.set("label", inferredDishName(file.name));
      const res = await fetch("/api/upload", { method: "POST", body: fd }).catch(() => null);
      if (!res?.ok) failed = true;
    }
    setDocumentState(failed ? "error" : "done");
    if (!failed) router.refresh();
    if (documentInputRef.current) documentInputRef.current.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) addPhotos(event.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      <section className="surface overflow-hidden rounded-2xl">
        <div className="border-b border-line p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl accent-soft-bg accent-text"><ImagePlus className="size-5" aria-hidden="true" /></span>
            <div>
              <h2 className="text-lg font-extrabold">{fa ? "عکس‌های غذا برای ویرایش و قرار دادن در منو" : "Food photos for editing and menu placement"}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">{fa ? "چند عکس را با هم انتخاب کنید، نام دقیق هر غذا را بنویسید و اصلاحات دلخواه را توضیح دهید. فوریکسو تصاویر را ویرایش می‌کند و در آیتم درست منو قرار می‌دهد." : "Choose several photos at once, name each dish precisely, and describe the edits you want. Foryxo will edit them and place each image on the correct menu item."}</p>
              <p className="mt-2 text-xs font-bold accent-text">{fa ? "هزینه نهایی بر اساس تعداد و میزان ویرایش تصاویر تأیید می‌شود." : "The final charge is confirmed from the image count and editing scope."}</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <input ref={photoInputRef} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" multiple onChange={(event) => event.target.files && addPhotos(event.target.files)} />
          <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} className={`rounded-2xl border-2 border-dashed p-7 text-center transition duration-300 ${dragging ? "scale-[1.01] border-[var(--accent)] accent-soft-bg" : "border-line bg-subtle/50"}`}>
            <UploadCloud className="mx-auto size-8 text-muted" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold">{fa ? "عکس‌ها را اینجا رها کنید" : "Drop food photos here"}</p>
            <p className="mt-1 text-xs text-muted">{fa ? "حداکثر ۳۰ تصویر در هر نوبت؛ هر فایل تا ۲۵ مگابایت" : "Up to 30 photos per batch; 25 MB per file"}</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={() => photoInputRef.current?.click()}><ImagePlus className="size-4" aria-hidden="true" />{fa ? "انتخاب چند عکس" : "Choose multiple photos"}</Button>
          </div>

          {batchError ? <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-300" role="alert">{batchError}</p> : null}

          {queue.length ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-extrabold">{totalLabel}{completedCount ? ` · ${completedCount} ${fa ? "بارگذاری شده" : "uploaded"}` : ""}</p>
                <button type="button" disabled={uploading} onClick={() => { queue.forEach((item) => URL.revokeObjectURL(item.previewUrl)); setQueue([]); }} className="text-xs font-bold text-muted transition hover:text-red-500 disabled:opacity-50">{fa ? "پاک کردن فهرست" : "Clear list"}</button>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {queue.map((item, index) => (
                  <div key={item.id} className={`rounded-2xl border p-3 transition ${item.status === "done" ? "border-emerald-500/40 bg-emerald-500/5" : item.status === "error" ? "border-red-500/40" : "border-line bg-elevated"}`}>
                    <div className="flex gap-3">
                      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-subtle"><Image src={item.previewUrl} alt="" fill unoptimized sizes="96px" className="object-cover" /><span className="absolute start-1 top-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-black text-white">{index + 1}</span></div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <label className="block text-xs font-black text-muted">{fa ? "نام غذا یا محصول *" : "Dish or product name *"}<Input value={item.label} onChange={(event) => patchItem(item.id, { label: event.target.value })} maxLength={120} disabled={item.status === "uploading" || item.status === "done"} className="mt-1" aria-invalid={!item.label.trim()} /></label>
                        <p className="truncate text-[11px] text-muted" title={item.file.name}>{item.file.name}</p>
                      </div>
                      <button type="button" onClick={() => removeItem(item.id)} disabled={item.status === "uploading"} className="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40" aria-label={fa ? `حذف ${item.label}` : `Remove ${item.label}`}><Trash2 className="size-4" aria-hidden="true" /></button>
                    </div>
                    <label className="mt-3 block text-xs font-black text-muted">{fa ? "توضیح ویرایش یا نکته این غذا (اختیاری)" : "Editing instructions or dish notes (optional)"}<Textarea value={item.notes} onChange={(event) => patchItem(item.id, { notes: event.target.value })} rows={2} maxLength={1000} disabled={item.status === "uploading" || item.status === "done"} className="mt-1" placeholder={fa ? "مثلاً: پس‌زمینه روشن، حذف ظرف اضافه، رنگ طبیعی…" : "For example: bright background, remove extra plate, natural color…"} /></label>
                    <div className="mt-2 min-h-5 text-xs font-bold" role="status">
                      {item.status === "uploading" ? <span className="inline-flex items-center gap-1 text-muted"><Loader2 className="size-3.5 animate-spin" />{fa ? "در حال بارگذاری…" : "Uploading…"}</span> : null}
                      {item.status === "done" ? <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300"><Check className="size-3.5" />{fa ? "برای سازنده ارسال شد" : "Sent to creator"}</span> : null}
                      {item.status === "error" ? <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-300"><RotateCcw className="size-3.5" />{item.error || L.error}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" size="lg" className="w-full" onClick={() => void uploadBatch()} disabled={uploading || pendingCount === 0 || invalidCount > 0}>{uploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="size-4" aria-hidden="true" />}{uploading ? (fa ? "در حال ارسال…" : "Uploading…") : fa ? `ارسال ${pendingCount} تصویر به سازنده` : `Send ${pendingCount} photo${pendingCount === 1 ? "" : "s"} to creator`}</Button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="surface-subtle flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden="true" /><div><h2 className="text-sm font-extrabold">{fa ? "فایل منو، PDF یا اکسل" : "Menu document, PDF, or spreadsheet"}</h2><p className="mt-1 text-xs text-muted">{fa ? "برای اطلاعات منو تا ۱۰ فایل PDF، CSV، XLS یا XLSX را با هم بفرستید." : "Send up to 10 PDF, CSV, XLS, or XLSX files for your menu data."}</p>{documentState === "done" ? <p className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">{fa ? "فایل‌ها بارگذاری شدند." : "Files uploaded."}</p> : null}{documentState === "error" ? <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-300">{L.error}</p> : null}</div></div>
        <input ref={documentInputRef} type="file" multiple className="sr-only" accept="application/pdf,text/csv,.csv,.xlsx,.xls" onChange={(event) => event.target.files && void uploadDocuments(event.target.files)} />
        <Button type="button" variant="secondary" disabled={documentState === "uploading"} onClick={() => documentInputRef.current?.click()}>{documentState === "uploading" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="size-4" aria-hidden="true" />}{documentState === "uploading" ? (fa ? "در حال ارسال…" : "Uploading…") : L.upload}</Button>
      </section>
    </div>
  );
}
