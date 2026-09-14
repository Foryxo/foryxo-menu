"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/primitives";
import { toAsciiDigits } from "@/domains/i18n/normalize";
import type { Locale } from "@/domains/i18n/config";

export function ContactForm({
  locale,
  submitLabel,
  successLabel,
  nameLabel,
  businessLabel,
  contactLabel,
  messageLabel,
  errorLabel,
}: {
  locale: Locale;
  submitLabel: string;
  successLabel: string;
  nameLabel: string;
  businessLabel: string;
  contactLabel: string;
  messageLabel: string;
  errorLabel: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          name: String(fd.get("name") ?? "").slice(0, 80),
          business: String(fd.get("business") ?? "").slice(0, 120),
          contact: toAsciiDigits(String(fd.get("contact") ?? "")).slice(0, 120),
          message: String(fd.get("message") ?? "").slice(0, 2000),
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" role="status">
        {successLabel}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      <div>
        <label htmlFor="cf-name" className="mb-1.5 block text-sm font-medium">{nameLabel}</label>
        <Input id="cf-name" name="name" required maxLength={80} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="cf-business" className="mb-1.5 block text-sm font-medium">{businessLabel}</label>
        <Input id="cf-business" name="business" required maxLength={120} autoComplete="organization" />
      </div>
      <div>
        <label htmlFor="cf-contact" className="mb-1.5 block text-sm font-medium">{contactLabel}</label>
        <Input id="cf-contact" name="contact" required maxLength={120} autoComplete="email" inputMode="email" />
      </div>
      <div>
        <label htmlFor="cf-message" className="mb-1.5 block text-sm font-medium">{messageLabel}</label>
        <Textarea id="cf-message" name="message" required maxLength={2000} rows={5} />
      </div>
      {status === "error" ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">{errorLabel}</p>
      ) : null}
      <Button type="submit" loading={status === "sending"} size="lg">
        {submitLabel}
      </Button>
    </form>
  );
}
