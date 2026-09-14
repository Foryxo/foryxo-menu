"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/primitives";
import { sanitizeNote } from "@/lib/utils";
import type { Locale } from "@/domains/i18n/config";

interface Labels {
  newRequest: string;
  category: string;
  categories: Record<string, string>;
  title: string;
  description: string;
  urgency: string;
  normal: string;
  urgent: string;
  submit: string;
  error: string;
}

export function NewRequestForm({
  businessId, locale, labels: L,
}: {
  businessId: string; locale: Locale; labels: Labels;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          category: String(fd.get("category")),
          title: sanitizeNote(String(fd.get("title") ?? ""), 120),
          body: sanitizeNote(String(fd.get("body") ?? ""), 2000),
          urgency: String(fd.get("urgency")) === "urgent" ? "urgent" : "normal",
          preferredDate: String(fd.get("preferredDate") ?? "") || undefined,
          locale,
        }),
      });
      if (res.ok) {
        setDone(true);
        setOpen(false);
        window.location.reload();
      } else {
        setError(L.error);
      }
    } catch {
      setError(L.error);
    } finally {
      setBusy(false);
    }
  }

  if (!businessId) return null;

  return (
    <div className="surface rounded-2xl p-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between font-extrabold"
        aria-expanded={open}
      >
        {L.newRequest}
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        done ? (
          <p className="mt-4 text-sm font-bold text-emerald-600 dark:text-emerald-400" role="status">✓</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              <span className="mb-1.5 block">{L.category}</span>
              <Select name="category" required defaultValue="price_change">
                {Object.entries(L.categories).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </label>
            <label className="block text-sm font-medium">
              <span className="mb-1.5 block">{L.title}</span>
              <Input name="title" required maxLength={120} />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              <span className="mb-1.5 block">{L.description}</span>
              <Textarea name="body" required maxLength={2000} rows={4} />
            </label>
            <label className="block text-sm font-medium">
              <span className="mb-1.5 block">{L.urgency}</span>
              <Select name="urgency" defaultValue="normal">
                <option value="normal">{L.normal}</option>
                <option value="urgent">{L.urgent}</option>
              </Select>
            </label>
            <label className="block text-sm font-medium">
              <span className="mb-1.5 block">{locale === "fa" ? "تاریخ مطلوب (اختیاری)" : "Preferred date (optional)"}</span>
              <Input name="preferredDate" type="date" />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" loading={busy}>{L.submit}</Button>
            </div>
            {error ? <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2" role="alert">{error}</p> : null}
          </form>
        )
      ) : null}
    </div>
  );
}
